import Phaser from 'phaser';
import { definition } from '../../../src/engine/definitions.js';
import { ARTWORK } from '../../../src/world/artwork.js';
import { DIRS, cornerDiagonal, floorKey, openingFile, pieceFile, stepOf, type Dir, type FloorMaterial } from '../../../src/world/connectors.js';
import { LOCATIONS, locationById } from '../../../src/world/locations.js';
import { feetOf, move, nearest, tileAt, wish } from '../../../src/world/movement.js';
import { advanceNavigation, interpretTap, targetBoxes, pickTarget } from '../../../src/world/navigation.js';
import type { ApproachDecision, MoveDecision, NavActor, NavExit } from '../../../src/world/navigation.js';
import { layPoints, planRoute, recoverFeet } from '../../../src/world/path.js';
import { paletteById } from '../../../src/world/palettes.js';
import { DISTRICT_RESONANCE, ringRadius } from '../../../src/world/resonance.js';
import { TILE, TILE_SIZE } from '../../../src/world/tiles.js';
import { localTransport } from '../../../src/world/transport.js';
import type { ExitDef, Facing, LocationDef } from '../../../src/world/types.js';
import { openWorldThing, persist, session, showTalk, travelTo } from '../controller.js';
import { cue } from '../sound.js';
import { paintActor, paintPlate, paintTile } from './art.js';
import { navigation } from './intent.js';
import {
  ARCHITECTURE_FILES,
  FLOOR_FILES,
  FURNITURE_FILES,
  MINERAL_TILES,
  NPCS,
  PLAYER_FACINGS,
  TRANSITION_FILES,
  catalogue64,
  mineralUrl,
  npcFile,
  playerFile,
} from './mineral.js';

const transport = localTransport();
const SPEED = 88;
const RADIUS = 6;

interface LiveCourse {
  decision: MoveDecision | ApproachDecision;
  index: number;
  replanned: boolean;
  stuck: number;
}

interface Gesture {
  id: number;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  t: number;
  dragged: boolean;
  swallowed: boolean;
  hinted: boolean;
}
const OVERLAY: Readonly<Record<number, string>> = {
  [TILE.counter]: 'counter',
  [TILE.pipe]: 'pipe',
  [TILE.vent]: 'vent',
  [TILE.lamp]: 'lamp',
  [TILE.tree]: 'tree',
  [TILE.reed]: 'reed',
  [TILE.vein]: 'vein',
  [TILE.lantern]: 'lantern',
  [TILE.awning]: 'awning',
};

const STRUCTURE = new Set<number>([TILE.roof, TILE.wall, TILE.interior, TILE.door, TILE.window, TILE.pipe, TILE.vent]);

export class DistrictScene extends Phaser.Scene {
  private place: LocationDef = locationById('district-01');
  private body: Phaser.GameObjects.Image | null = null;
  private props: Phaser.GameObjects.Image[] = [];
  private rings: Phaser.GameObjects.Graphics | null = null;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private walked = 0;
  private seq = 0;
  private displayKey = '';
  private samples = 0;
  private sampleMs = 0;
  private course: LiveCourse | null = null;
  private seenEpoch = 0;
  private userZoom = 2;
  private camX = 0;
  private camY = 0;
  private camReady = false;
  private snapCamera = true;
  private occluders: Phaser.GameObjects.Image[] = [];
  private markGfx: Phaser.GameObjects.Graphics | null = null;
  private selectGfx: Phaser.GameObjects.Graphics | null = null;
  private mark: { x: number; y: number; dying: number | null } | null = null;
  private selection: { left: number; top: number; right: number; bottom: number; dying: number | null } | null = null;
  private gesture: Gesture | null = null;
  private pointers = new Set<number>();
  private pinch = false;
  private pinchDist = 0;
  private pinchZoom = 2;
  private travelling = false;
  private exitMute = 0;
  private noteUntil = 0;
  private keyed = false;
  private movedSinceSave = false;

  constructor() {
    super('district');
  }

  preload(): void {
    for (const [key, file] of Object.entries(MINERAL_TILES)) this.load.image(key, mineralUrl(file));
    for (const [key, file] of Object.entries(FLOOR_FILES)) this.load.image(key, mineralUrl(file));
    for (const [key, file] of Object.entries(TRANSITION_FILES)) this.load.image(key, mineralUrl(file));
    for (const [key, file] of Object.entries(FURNITURE_FILES)) this.load.image(key, mineralUrl(file));
    for (const file of ARCHITECTURE_FILES) this.load.image(file, mineralUrl(`architecture/${file}`));
    for (const link of ARTWORK) {
      if (link.plateFile) this.load.image(`item-${link.definitionId}`, mineralUrl(catalogue64(link.plateFile)));
    }
    for (const facing of PLAYER_FACINGS) {
      for (let frame = 0; frame < 4; frame += 1) this.load.image(`you-${facing}-${frame}`, mineralUrl(playerFile(facing, frame)));
    }
    for (const id of NPCS) {
      for (const facing of PLAYER_FACINGS) this.load.image(`person-${id}-${facing}`, mineralUrl(npcFile(id, facing)));
    }
  }

  create(): void {
    for (const key of Object.keys(MINERAL_TILES)) this.nearest(key);
    for (const key of Object.keys(FLOOR_FILES)) this.nearest(key);
    for (const key of Object.keys(TRANSITION_FILES)) this.nearest(key);
    for (const key of Object.keys(FURNITURE_FILES)) this.nearest(key);
    for (const file of ARCHITECTURE_FILES) this.nearest(file);
    for (const link of ARTWORK) if (link.plateFile) this.nearest(`item-${link.definitionId}`);
    for (const facing of PLAYER_FACINGS) {
      for (let frame = 0; frame < 4; frame += 1) this.nearest(`you-${facing}-${frame}`);
      for (const id of NPCS) this.nearest(`person-${id}-${facing}`);
    }
    this.input.keyboard?.addCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE');
    this.keys = (this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;
    this.cameras.main.setBackgroundColor('#5c5348');
    this.cameras.main.roundPixels = true;
    this.markGfx = this.add.graphics();
    this.selectGfx = this.add.graphics().setDepth(50_000);
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.onDown, this);
      this.input.off('pointermove', this.onMove, this);
      this.input.off('pointerup', this.onUp, this);
      this.input.off('pointerupoutside', this.onUp, this);
      this.scale.off('resize', this.onResize, this);
      this.input.keyboard?.removeAllKeys(true);
    });
    this.seenEpoch = navigation.epoch;
    this.bootPlace();
  }

  private onResize = (): void => {
    this.frameCamera();
  };

  private frameCamera(): void {
    const zoom = this.userZoom;
    this.cameras.main.setZoom(zoom);
    const worldW = this.place.width * TILE_SIZE;
    const worldH = this.place.height * TILE_SIZE;
    const padX = Math.max(0, this.scale.width / zoom - worldW) / 2;
    const padY = Math.max(0, this.scale.height / zoom - worldH) / 2;
    this.cameras.main.setBounds(-padX, -padY, worldW + padX * 2, worldH + padY * 2);
    if (this.body) this.look(0, true);
  }

  private nearest(key: string): void {
    if (this.textures.exists(key)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private texture(key: string, canvas: HTMLCanvasElement): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private bootPlace(): void {
    for (const prop of this.props) prop.destroy();
    this.props = [];
    this.body?.destroy();
    this.rings?.destroy();
    this.body = null;
    this.rings = null;
    this.occluders = [];
    this.place = locationById(session.world.locationId);
    const fixed = recoverFeet(this.place.solid, session.world.x, session.world.y, RADIUS);
    if (Math.abs(fixed.x - session.world.x) > 0.5 || Math.abs(fixed.y - session.world.y) > 0.5) {
      session.world.x = fixed.x;
      session.world.y = fixed.y;
      persist();
    }
    this.displayKey = JSON.stringify(session.world.displays);
    const palette = paletteById(this.place.paletteId);
    this.cameras.main.setBackgroundColor(palette.groundDeep);
    this.ensureFallback(palette);
    const draw = 2;
    const ground = document.createElement('canvas');
    ground.width = this.place.width * TILE_SIZE * draw;
    ground.height = this.place.height * TILE_SIZE * draw;
    const pen = ground.getContext('2d');
    if (!pen) return;
    pen.imageSmoothingEnabled = false;
    for (let y = 0; y < this.place.height; y += 1) {
      for (let x = 0; x < this.place.width; x += 1) {
        const source = this.sheet(this.floorAt(x, y));
        if (source) pen.drawImage(source, x * TILE_SIZE * draw, y * TILE_SIZE * draw, TILE_SIZE * draw, TILE_SIZE * draw);
      }
    }
    this.texture(`ground-${this.place.id}`, ground);
    const base = this.add.image(0, 0, `ground-${this.place.id}`).setOrigin(0, 0).setDepth(0);
    base.setDisplaySize(this.place.width * TILE_SIZE, this.place.height * TILE_SIZE);
    this.props.push(base);
    const occupied = new Set(this.place.actors.map((actor) => `${actor.tx},${actor.ty}`));
    const displays = new Set(this.place.actors.filter((actor) => actor.slot).map((actor) => `${actor.tx},${actor.ty}`));
    for (let y = 0; y < this.place.height; y += 1) {
      for (let x = 0; x < this.place.width; x += 1) {
        const tile = this.place.tiles[y]?.[x] ?? 0;
        this.architecture(x, y, tile);
        if (tile === TILE.counter && displays.has(`${x},${y}`)) continue;
        if (tile === TILE.counter && !occupied.has(`${x},${y}`)) {
          this.overlay('furniture-pedestal', x, y);
          continue;
        }
        const key = OVERLAY[tile];
        if (key) this.overlay(key, x, y);
      }
    }
    for (const actor of this.place.actors) {
      if (actor.form === 'person') {
        const key = `person-${actor.id}-${actor.facing}`;
        if (this.textures.exists(key)) this.prop(key, actor.tx, actor.ty, 24, 32);
        else {
          const painted = `npc-${actor.id}`;
          this.texture(painted, paintActor(actor.facing, 0, actor.coat, actor.accessory, palette));
          this.prop(painted, actor.tx, actor.ty, 24, 32);
        }
      } else if (actor.form === 'furnishing' && actor.slot) {
        const slot = actor.slot;
        const furniture = slot === 'shelf-b' ? 'furniture-glass' : 'furniture-shelf';
        this.prop(furniture, actor.tx, actor.ty, TILE_SIZE, TILE_SIZE);
        const owned = session.profile.inventory.find((item) => item.id === session.world.displays[slot]);
        if (!owned) continue;
        const def = definition(owned.definitionId);
        const itemKey = `item-${def.id}`;
        if (this.textures.exists(itemKey)) this.itemOnShelf(itemKey, actor.tx, actor.ty);
        else {
          const painted = `plate-${def.category}`;
          if (!this.textures.exists(painted)) this.texture(painted, paintPlate(palette.sera, palette));
          this.itemOnShelf(painted, actor.tx, actor.ty);
        }
      }
    }
    this.body = this.add.image(session.world.x, session.world.y, `you-${session.world.facing}-0`).setOrigin(0.5, 1);
    this.body.setDisplaySize(24, 32);
    this.body.setDepth(session.world.y);
    this.rings = this.add.graphics();
    this.frameCamera();
    this.setPrompt(null);
  }

  private sheet(key: string): CanvasImageSource | null {
    if (!this.textures.exists(key)) return null;
    return this.textures.get(key).getSourceImage() as CanvasImageSource;
  }

  private tile(x: number, y: number): number | null {
    const row = this.place.tiles[y];
    if (!row || x < 0 || x >= row.length) return null;
    return row[x] ?? null;
  }

  private materialAt(x: number, y: number): FloorMaterial | null {
    const tile = this.tile(x, y);
    if (tile === null) return null;
    if (this.place.id === 'residence') return 'bone-ceramic';
    if (tile === TILE.path) return 'resonance-path';
    if (tile === TILE.roof || tile === TILE.interior || tile === TILE.door || tile === TILE.window || tile === TILE.pipe || tile === TILE.vent) {
      return 'bone-ceramic';
    }
    return 'mineral-paving';
  }

  private floorAt(x: number, y: number): string {
    const here = this.materialAt(x, y) ?? 'mineral-paving';
    const neighbors: Partial<Record<Dir, FloorMaterial | null>> = {};
    for (const dir of DIRS) {
      const step = stepOf(dir);
      neighbors[dir] = this.materialAt(x + step.x, y + step.y);
    }
    return floorKey(here, neighbors);
  }

  /** A door or window cut into a roof run still counts so the roof meets the frame instead of notching. */
  private countsAsRoof(x: number, y: number): boolean {
    const tile = this.tile(x, y);
    if (tile === TILE.roof) return true;
    if (tile !== TILE.door && tile !== TILE.window) return false;
    return this.tile(x - 1, y) === TILE.roof || this.tile(x + 1, y) === TILE.roof || this.tile(x, y - 1) === TILE.roof || this.tile(x, y + 1) === TILE.roof;
  }

  private isStructure(x: number, y: number): boolean {
    const tile = this.tile(x, y);
    return tile !== null && STRUCTURE.has(tile);
  }

  /** Perimeter walls, plus a door or window that continues an east-west run. North-south doors stay open gaps. */
  private inWallMask(x: number, y: number): boolean {
    const tile = this.tile(x, y);
    if (tile === null) return false;
    if (tile === TILE.wall) return true;
    if (tile === TILE.interior || tile === TILE.pipe || tile === TILE.vent) return DIRS.some((dir) => !this.isStructure(x + stepOf(dir).x, y + stepOf(dir).y));
    if (tile === TILE.door) return this.horizontalRun(x, y);
    if (tile === TILE.window) return this.horizontalRun(x, y) || this.verticalRun(x, y);
    return false;
  }

  private horizontalRun(x: number, y: number): boolean {
    return this.isStructure(x - 1, y) && this.isStructure(x + 1, y) && !(this.isStructure(x, y - 1) && this.isStructure(x, y + 1));
  }

  private verticalRun(x: number, y: number): boolean {
    return this.isStructure(x, y - 1) && this.isStructure(x, y + 1) && !(this.isStructure(x - 1, y) && this.isStructure(x + 1, y));
  }

  private maskDirs(x: number, y: number): Dir[] {
    return DIRS.filter((dir) => this.inWallMask(x + stepOf(dir).x, y + stepOf(dir).y));
  }

  private architecture(x: number, y: number, tile: number): void {
    if (tile === TILE.roof) {
      const dirs = DIRS.filter((dir) => this.countsAsRoof(x + stepOf(dir).x, y + stepOf(dir).y));
      this.overlay(pieceFile('roof', dirs, 'outer') ?? 'roof-straight-ew.png', x, y);
    }
    const opening = tile === TILE.door || tile === TILE.window ? openingFile(tile === TILE.door ? 'door' : 'window', this.horizontalRun(x, y) ? ['e', 'w'] : []) : null;
    if (opening) {
      this.overlay(opening, x, y);
      return;
    }
    if (tile === TILE.window && this.verticalRun(x, y)) {
      this.overlay('wall-straight-ns.png', x, y);
      return;
    }
    if (!this.inWallMask(x, y) || tile === TILE.door) return;
    const dirs = this.maskDirs(x, y);
    if (tile === TILE.wall && openingFile('door', dirs) && (this.tile(x, y - 1) === TILE.door || this.tile(x, y + 1) === TILE.door)) {
      this.overlay('door-frame-open.png', x, y);
      return;
    }
    if (tile === TILE.wall && openingFile('window', dirs) && (this.tile(x, y - 1) === TILE.window || this.tile(x, y + 1) === TILE.window)) {
      this.overlay('window-open.png', x, y);
      return;
    }
    const diagonal = cornerDiagonal(dirs);
    const inner = diagonal ? this.inWallMask(x + diagonal.x, y + diagonal.y) : false;
    const file = pieceFile('wall', dirs, inner ? 'inner' : 'outer');
    if (file) this.overlay(file, x, y);
  }

  private overlay(key: string, x: number, y: number): void {
    if (!this.textures.exists(key)) return;
    const image = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, (y + 1) * TILE_SIZE, key).setOrigin(0.5, 1);
    image.setDisplaySize(TILE_SIZE, TILE_SIZE);
    image.setDepth((y + 1) * TILE_SIZE);
    this.props.push(image);
    if (key === 'tree' || key.startsWith('roof')) this.occluders.push(image);
  }

  private ensureFallback(palette: ReturnType<typeof paletteById>): void {
    if (this.textures.exists('floor-mineral-paving')) return;
    this.texture('floor-mineral-paving', paintTile(TILE.ground, palette));
    this.texture('floor-bone-ceramic', paintTile(TILE.interior, palette));
    this.texture('floor-resonance-path', paintTile(TILE.path, palette));
    this.texture('floor-interior-floor', paintTile(TILE.interior, palette));
    this.texture('floor-industrial-metal', paintTile(TILE.interior, palette));
    this.texture('floor-soil', paintTile(TILE.ground, palette));
  }

  private prop(key: string, tx: number, ty: number, width: number, height: number): void {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y, key).setOrigin(0.5, 1).setDisplaySize(width, height).setDepth(feet.y);
    this.props.push(image);
  }

  private itemOnShelf(key: string, tx: number, ty: number): void {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y - 14, key).setOrigin(0.5, 1).setDisplaySize(16, 16).setDepth(feet.y + 1);
    this.props.push(image);
  }

  override update(_time: number, delta: number): void {
    if (this.samples < 40) {
      this.sampleMs += delta;
      this.samples += 1;
      if (this.samples === 40) document.documentElement.dataset.frameMs = (this.sampleMs / 40).toFixed(2);
    }
    if (!this.body) return;
    this.syncPlace();
    if (!this.body) return;
    this.longPress();
    const frozen = session.panel !== null || navigation.suspended || this.travelling;
    if (frozen && this.course) {
      this.course = null;
      this.fadeMark();
      this.fadeSelection();
    }
    if (!frozen && this.keyboardStep(delta)) {
      if (this.noteUntil <= this.time.now) this.setPrompt(null);
    } else if (!frozen) {
      this.tryShortcut();
      if (this.course) {
        this.follow(delta);
        if (this.noteUntil <= this.time.now) this.setPrompt(null);
      } else {
        this.paintBody(session.world.facing, 0, session.world.x, session.world.y);
        if (this.noteUntil <= this.time.now) this.idlePrompt();
      }
    } else if (this.noteUntil <= this.time.now) this.setPrompt(null);
    this.look(delta, false);
    this.drawCue();
    this.fadeOcclusion();
    this.drawRings(document.documentElement.classList.contains('reduce') ? 0 : this.time.now);
    this.publish();
  }

  private syncPlace(): void {
    if (this.seenEpoch !== navigation.epoch) {
      this.seenEpoch = navigation.epoch;
      this.course = null;
      this.fadeMark();
      this.fadeSelection();
    }
    const shown = JSON.stringify(session.world.displays);
    if (this.place.id !== session.world.locationId || shown !== this.displayKey) {
      this.course = null;
      this.bootPlace();
      this.snapCamera = true;
    }
  }

  private look(delta: number, snap: boolean): void {
    if (!this.body) return;
    const reduce = document.documentElement.classList.contains('reduce');
    const lift = session.panel && this.scale.width < 900 ? Math.min(84, this.scale.height * 0.16) : 0;
    const targetX = this.body.x;
    const targetY = this.body.y + lift;
    if (!this.camReady || reduce || snap || this.snapCamera) {
      this.camX = targetX;
      this.camY = targetY;
      this.camReady = true;
      this.snapCamera = false;
    } else {
      const blend = 1 - Math.exp(-delta / 160);
      this.camX += (targetX - this.camX) * blend;
      this.camY += (targetY - this.camY) * blend;
    }
    this.cameras.main.centerOn(Math.round(this.camX), Math.round(this.camY));
  }

  private keyboardStep(delta: number): boolean {
    const ix = (this.down('A') || this.down('LEFT') ? -1 : 0) + (this.down('D') || this.down('RIGHT') ? 1 : 0);
    const iy = (this.down('W') || this.down('UP') ? -1 : 0) + (this.down('S') || this.down('DOWN') ? 1 : 0);
    if (ix === 0 && iy === 0) {
      if (this.keyed) {
        this.keyed = false;
        this.savePose();
      }
      return false;
    }
    this.keyed = true;
    if (this.course) {
      this.course = null;
      this.fadeMark();
      this.fadeSelection();
    }
    const step = wish(ix, iy, SPEED, delta / 1000);
    const next = move(this.place.solid, session.world.x, session.world.y, step.dx, step.dy, RADIUS);
    this.commitMotion(next.x, next.y, step.dx, step.dy, true);
    return true;
  }

  private follow(delta: number): void {
    const live = this.course;
    if (!live) return;
    const step = advanceNavigation(
      this.place.solid,
      session.world.x,
      session.world.y,
      live.decision.points,
      live.index,
      SPEED,
      delta / 1000,
      RADIUS,
    );
    if (step.stuck) {
      live.stuck += 1;
      if (live.stuck >= 8) {
        if (!live.replanned && this.replan(live)) {
          live.stuck = 0;
          return;
        }
        this.fail('No way through.');
      }
      return;
    }
    live.stuck = 0;
    live.index = step.index;
    const dx = step.x - session.world.x;
    const dy = step.y - session.world.y;
    this.commitMotion(step.x, step.y, dx, dy, Math.hypot(dx, dy) > 0.2);
    if (step.arrived) this.arrive(live.decision);
  }

  private replan(live: LiveCourse): boolean {
    live.replanned = true;
    const from = tileAt(session.world.x, session.world.y);
    const route = planRoute(this.place.solid, from, live.decision.goal);
    if (!route || (route.goal.tx === from.tx && route.goal.ty === from.ty)) return false;
    const end = live.decision.points[live.decision.points.length - 1] ?? { x: session.world.x, y: session.world.y };
    live.decision = {
      ...live.decision,
      points: layPoints(this.place.solid, session.world.x, session.world.y, route.cells, end.x, end.y, RADIUS),
    };
    live.index = 0;
    return true;
  }

  private arrive(decision: MoveDecision | ApproachDecision): void {
    this.course = null;
    if (decision.type === 'move') {
      this.fadeMark();
      this.savePose();
      return;
    }
    session.world.facing = decision.facing;
    this.paintBody(decision.facing, 0, session.world.x, session.world.y);
    this.fulfill(decision);
  }

  private fulfill(decision: ApproachDecision): void {
    this.course = null;
    session.world.facing = decision.facing;
    this.paintBody(decision.facing, 0, session.world.x, session.world.y);
    this.fadeSelection();
    if (decision.role === 'exit') {
      const exit = this.place.exits.find((item) => item.id === decision.targetId);
      if (!exit) {
        this.fail('The way is shut.');
        return;
      }
      this.beginTravel(exit);
      return;
    }
    const actor = this.place.actors.find((item) => item.id === decision.targetId);
    if (!actor) return;
    if (decision.arrival === 'direct') {
      cue(session.settings.sound, 'open');
      openWorldThing(actor);
      this.movedSinceSave = false;
      return;
    }
    cue(session.settings.sound, 'arrive');
    showTalk(
      actor,
      decision.actions.map((item) => ({ label: item.label, opens: item.opens })),
    );
    this.movedSinceSave = false;
  }

  private beginTravel(exit: ExitDef): void {
    if (this.travelling || this.time.now < this.exitMute) return;
    if (!Object.prototype.hasOwnProperty.call(LOCATIONS, exit.to)) {
      this.fail('The way is shut.');
      return;
    }
    this.travelling = true;
    this.course = null;
    const veil = this.veil();
    veil.classList.add('on');
    const reduce = document.documentElement.classList.contains('reduce');
    this.time.delayedCall(reduce ? 40 : 260, () => {
      cue(session.settings.sound, 'enter');
      travelTo(exit.to, exit.spawn);
      this.snapCamera = true;
      this.movedSinceSave = false;
      this.time.delayedCall(reduce ? 50 : 240, () => {
        veil.classList.remove('on');
        this.travelling = false;
        this.exitMute = this.time.now + 450;
      });
    });
  }

  private veil(): HTMLElement {
    const existing = document.querySelector('#world-veil');
    if (existing instanceof HTMLElement) return existing;
    const node = document.createElement('div');
    node.id = 'world-veil';
    document.querySelector('#world-host')?.appendChild(node);
    return node;
  }

  private commitTap(worldX: number, worldY: number, touch: boolean): void {
    if (session.panel || this.travelling || navigation.suspended || this.keysHeld()) return;
    const decision = interpretTap({
      solid: this.place.solid,
      actors: this.navActors(),
      exits: this.navExits(),
      playerX: session.world.x,
      playerY: session.world.y,
      worldX,
      worldY,
      pad: touch ? 14 : 6,
      radius: RADIUS,
    });
    if (decision.type === 'none' || (decision.type === 'move' && decision.trivial)) return;
    if (decision.type === 'blocked') {
      this.fail('No way through.');
      return;
    }
    if (decision.type === 'approach' && decision.immediate) {
      this.fadeMark();
      this.showSelection(decision);
      this.fulfill(decision);
      return;
    }
    this.course = { decision, index: decision.points.length > 1 ? 1 : 0, replanned: false, stuck: 0 };
    if (decision.type === 'move') {
      const end = decision.points[decision.points.length - 1];
      if (end) this.showMark(end.x, end.y);
      this.clearSelection();
      cue(session.settings.sound, 'go');
      return;
    }
    this.fadeMark();
    this.showSelection(decision);
  }

  private tryShortcut(): void {
    if (!this.just('E') && !this.just('SPACE')) return;
    const here = tileAt(session.world.x, session.world.y - 10);
    const actor = nearest(this.place.actors, here.tx, here.ty);
    const exit = nearest(this.place.exits, here.tx, here.ty);
    const target = actor ?? exit;
    if (!target) return;
    const feet = feetOf(target.tx, target.ty);
    const decision = interpretTap({
      solid: this.place.solid,
      actors: this.navActors(),
      exits: this.navExits(),
      playerX: session.world.x,
      playerY: session.world.y,
      worldX: feet.x,
      worldY: actor ? feet.y - 8 : target.ty * TILE_SIZE + TILE_SIZE / 2,
      pad: 18,
      radius: RADIUS,
    });
    if (decision.type !== 'approach') return;
    this.course = null;
    this.fadeMark();
    this.fulfill(decision);
  }

  private navActors(): NavActor[] {
    return this.place.actors.map((item) => ({
      id: item.id,
      name: item.name,
      tx: item.tx,
      ty: item.ty,
      facing: item.facing,
      kind: item.kind,
      form: item.form,
      line: item.line,
    }));
  }

  private navExits(): NavExit[] {
    return this.place.exits.map((item) => ({
      id: item.id,
      name: item.label,
      tx: item.tx,
      ty: item.ty,
      symbol: item.symbol,
      to: item.to,
    }));
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) return;
    this.pointers.add(pointer.id);
    if (this.pointers.size >= 2) {
      this.pinch = true;
      this.gesture = null;
      this.pinchDist = this.span();
      this.pinchZoom = this.userZoom;
      return;
    }
    const blocked = session.panel !== null || this.travelling || navigation.suspended;
    this.gesture = {
      id: pointer.id,
      x: pointer.x,
      y: pointer.y,
      worldX: pointer.worldX,
      worldY: pointer.worldY,
      t: this.time.now,
      dragged: blocked,
      swallowed: blocked,
      hinted: false,
    };
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (this.pinch && this.pointers.size >= 2) {
      const dist = this.span();
      if (this.pinchDist > 8 && dist > 0) {
        const raw = Phaser.Math.Clamp(this.pinchZoom * (dist / this.pinchDist), 1, 3);
        const next = Math.round(raw * 2) / 2;
        if (next !== this.userZoom) {
          this.userZoom = next;
          this.frameCamera();
        }
      }
      return;
    }
    const gesture = this.gesture;
    if (!gesture || gesture.id !== pointer.id) return;
    if (Math.hypot(pointer.x - gesture.x, pointer.y - gesture.y) > 16) gesture.dragged = true;
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    this.pointers.delete(pointer.id);
    if (this.pinch || this.pointers.size > 0) {
      this.gesture = null;
      if (this.pointers.size === 0) this.pinch = false;
      return;
    }
    const gesture = this.gesture;
    this.gesture = null;
    if (!gesture || gesture.id !== pointer.id || gesture.dragged || gesture.swallowed) return;
    this.commitTap(pointer.worldX, pointer.worldY, pointer.wasTouch === true);
  }

  private span(): number {
    const a = this.input.pointer1;
    const b = this.input.pointer2;
    if (!a?.isDown || !b?.isDown) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private longPress(): void {
    const gesture = this.gesture;
    if (!gesture || gesture.dragged || gesture.swallowed || gesture.hinted) return;
    if (this.time.now - gesture.t < 480) return;
    gesture.hinted = true;
    const hit = pickTarget(targetBoxes(this.navActors(), this.navExits(), 14), gesture.worldX, gesture.worldY);
    if (hit) this.feedback(hit.name);
  }

  private commitMotion(x: number, y: number, dx: number, dy: number, animate: boolean): void {
    const facing = facingOf(dx, dy, session.world.facing);
    if (x !== session.world.x || y !== session.world.y) {
      this.walked += Math.hypot(x - session.world.x, y - session.world.y);
      this.movedSinceSave = true;
    }
    const frame = animate ? Math.floor(this.walked / 8) % 4 : 0;
    session.world.x = x;
    session.world.y = y;
    session.world.facing = facing;
    this.paintBody(facing, frame, x, y);
    this.seq += 1;
    if (this.seq % 30 === 0) transport.send({ locationId: this.place.id, x, y, facing, seq: this.seq });
  }

  private paintBody(facing: Facing, frame: number, x: number, y: number): void {
    if (!this.body) return;
    this.body.setPosition(Math.round(x), Math.round(y));
    this.body.setTexture(`you-${facing}-${frame}`);
    this.body.setDisplaySize(24, 32);
    this.body.setDepth(y);
  }

  private savePose(): void {
    if (!this.movedSinceSave) return;
    this.movedSinceSave = false;
    persist();
  }

  private fail(text: string): void {
    this.course = null;
    this.fadeMark();
    this.feedback(text);
    cue(session.settings.sound, 'blocked');
  }

  private feedback(text: string): void {
    this.setPrompt(text);
    this.noteUntil = this.time.now + 1800;
  }

  private idlePrompt(): void {
    const here = tileAt(session.world.x, session.world.y - 10);
    const actor = nearest(this.place.actors, here.tx, here.ty);
    const exit = nearest(this.place.exits, here.tx, here.ty);
    this.setPrompt(actor?.name ?? exit?.label ?? null);
  }

  private showMark(x: number, y: number): void {
    this.mark = { x, y, dying: null };
  }

  private fadeMark(): void {
    if (this.mark && this.mark.dying === null) this.mark.dying = this.time.now;
  }

  private clearSelection(): void {
    this.selection = null;
  }

  private fadeSelection(): void {
    if (this.selection && this.selection.dying === null) this.selection.dying = this.time.now;
  }

  private showSelection(decision: ApproachDecision): void {
    if (decision.role === 'actor') {
      const actor = this.place.actors.find((item) => item.id === decision.targetId);
      if (!actor) return;
      const feet = feetOf(actor.tx, actor.ty);
      this.selection =
        actor.form === 'person'
          ? { left: feet.x - 14, top: feet.y - 34, right: feet.x + 14, bottom: feet.y + 2, dying: null }
          : { left: actor.tx * TILE_SIZE, top: actor.ty * TILE_SIZE, right: (actor.tx + 1) * TILE_SIZE, bottom: (actor.ty + 1) * TILE_SIZE, dying: null };
      return;
    }
    const exit = this.place.exits.find((item) => item.id === decision.targetId);
    if (!exit) return;
    this.selection = {
      left: exit.tx * TILE_SIZE,
      top: exit.ty * TILE_SIZE,
      right: (exit.tx + 1) * TILE_SIZE,
      bottom: (exit.ty + 1) * TILE_SIZE,
      dying: null,
    };
  }

  private drawCue(): void {
    const reduce = document.documentElement.classList.contains('reduce');
    this.drawMark(reduce);
    this.drawSelection(reduce);
  }

  private fading(dying: number | null, reduce: boolean): number {
    if (dying === null) return 0.9;
    if (reduce) return 0;
    const t = (this.time.now - dying) / 320;
    return t >= 1 ? 0 : 0.9 * (1 - t);
  }

  private drawMark(reduce: boolean): void {
    const pen = this.markGfx;
    if (!pen) return;
    pen.clear();
    const mark = this.mark;
    if (!mark) return;
    const alpha = this.fading(mark.dying, reduce);
    if (alpha <= 0) {
      this.mark = null;
      return;
    }
    pen.setDepth(mark.y - 8);
    pen.lineStyle(1, 0xe7e1d6, alpha);
    pen.beginPath();
    pen.moveTo(mark.x, mark.y - 6);
    pen.lineTo(mark.x + 5, mark.y);
    pen.lineTo(mark.x, mark.y + 4);
    pen.lineTo(mark.x - 5, mark.y);
    pen.closePath();
    pen.strokePath();
    pen.fillStyle(0xc4963a, alpha);
    pen.fillRect(mark.x - 1, mark.y - 1, 2, 2);
  }

  private drawSelection(reduce: boolean): void {
    const pen = this.selectGfx;
    if (!pen) return;
    pen.clear();
    const box = this.selection;
    if (!box) return;
    const alpha = this.fading(box.dying, reduce);
    if (alpha <= 0) {
      this.selection = null;
      return;
    }
    const n = 6;
    pen.lineStyle(1, 0xe7e1d6, alpha);
    pen.beginPath();
    pen.moveTo(box.left, box.top + n);
    pen.lineTo(box.left, box.top);
    pen.lineTo(box.left + n, box.top);
    pen.moveTo(box.right - n, box.top);
    pen.lineTo(box.right, box.top);
    pen.lineTo(box.right, box.top + n);
    pen.moveTo(box.right, box.bottom - n);
    pen.lineTo(box.right, box.bottom);
    pen.lineTo(box.right - n, box.bottom);
    pen.moveTo(box.left + n, box.bottom);
    pen.lineTo(box.left, box.bottom);
    pen.lineTo(box.left, box.bottom - n);
    pen.strokePath();
  }

  private fadeOcclusion(): void {
    const body = this.body;
    if (!body) return;
    const reduce = document.documentElement.classList.contains('reduce');
    const left = body.x - 12;
    const top = body.y - 32;
    const right = body.x + 12;
    const bottom = body.y;
    for (const image of this.occluders) {
      const halfW = image.displayWidth / 2;
      const leftB = image.x - halfW;
      const rightB = image.x + halfW;
      const bottomB = image.y;
      const topB = image.y - image.displayHeight;
      const cover = rightB > left && leftB < right && bottomB > top && topB < bottom && image.depth + 0.5 >= body.depth;
      const target = cover ? 0.32 : 1;
      image.setAlpha(reduce ? target : image.alpha + (target - image.alpha) * 0.25);
    }
  }

  private publish(): void {
    const root = document.documentElement;
    const cam = this.cameras.main;
    root.dataset.pose = `${session.world.x.toFixed(1)},${session.world.y.toFixed(1)},${session.world.facing},${session.world.locationId}`;
    root.dataset.cam = `${cam.scrollX.toFixed(1)},${cam.scrollY.toFixed(1)},${cam.zoom}`;
    root.dataset.nav = this.travelling ? 'travel' : session.panel ? 'panel' : this.course ? 'walk' : 'idle';
  }

  private keysHeld(): boolean {
    return this.down('A') || this.down('D') || this.down('W') || this.down('S') || this.down('LEFT') || this.down('RIGHT') || this.down('UP') || this.down('DOWN');
  }

  private down(name: string): boolean {
    return this.keys[name]?.isDown === true;
  }

  private just(name: string): boolean {
    const key = this.keys[name];
    return key ? Phaser.Input.Keyboard.JustDown(key) : false;
  }

  private setPrompt(text: string | null): void {
    const node = document.querySelector('[data-prompt]');
    if (node) node.textContent = text ?? '';
  }

  private drawRings(now: number): void {
    if (!this.rings || !this.place.resonance) {
      this.rings?.clear();
      return;
    }
    const at = feetOf(this.place.resonance.tx, this.place.resonance.ty);
    this.rings.setDepth(at.y - 4);
    this.rings.clear();
    const color = Number.parseInt(DISTRICT_RESONANCE.color.slice(1), 16);
    this.rings.lineStyle(1, color, 0.85);
    for (let i = 0; i < DISTRICT_RESONANCE.rings; i += 1) {
      this.rings.strokeCircle(at.x, at.y - 10, ringRadius(DISTRICT_RESONANCE, i, now));
    }
  }
}

const facingOf = (dx: number, dy: number, current: Facing): Facing => {
  if (dx === 0 && dy === 0) return current;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'w' : 'e';
  return dy < 0 ? 'n' : 's';
};
