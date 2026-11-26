import Phaser from 'phaser';
import { definition } from '../../../src/engine/definitions.js';
import { ARTWORK } from '../../../src/world/artwork.js';
import { DIRS, cornerDiagonal, floorKey, openingFile, pieceFile, stepOf, type Dir, type FloorMaterial } from '../../../src/world/connectors.js';
import {
  IDENTITY_FACINGS,
  IDENTITY_PEOPLE,
  IDENTITY_SCALE,
  coveredTiles,
  entranceFronts,
  facingToward,
  identityFrame,
  identityFrameFile,
  identitySheets,
  type IdentitySheet,
} from '../../../src/world/identity.js';
import { locationById } from '../../../src/world/locations.js';
import { feetOf, move, nearest, tileAt, wish } from '../../../src/world/movement.js';
import { paletteById } from '../../../src/world/palettes.js';
import { DISTRICT_RESONANCE, ringRadius } from '../../../src/world/resonance.js';
import { TILE, TILE_SIZE } from '../../../src/world/tiles.js';
import { localTransport } from '../../../src/world/transport.js';
import type { Facing, LocationDef } from '../../../src/world/types.js';
import { session, travelTo, openWorldThing } from '../controller.js';
import { paintActor, paintPlate, paintTile } from './art.js';
import { intent } from './intent.js';
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
  private shade: Phaser.GameObjects.Image | null = null;
  private props: Phaser.GameObjects.Image[] = [];
  private foreground: Phaser.GameObjects.Image[] = [];
  private people: { id: string; facing: Facing; image: Phaser.GameObjects.Image }[] = [];
  private rings: Phaser.GameObjects.Graphics | null = null;
  private useUntil = 0;
  private npcUntil = new Map<string, number>();
  private npcFace = new Map<string, Facing>();
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private walked = 0;
  private seq = 0;
  private displayKey = '';
  private samples = 0;
  private sampleMs = 0;

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
    const files = new Set(identitySheets(locationById('district-01')).concat(identitySheets(locationById('residence'))).map((sheet) => sheet.file));
    for (const file of files) this.load.image(file, mineralUrl(file));
    this.load.image('identity/contact-shadow.png', mineralUrl('identity/contact-shadow.png'));
    for (const person of IDENTITY_PEOPLE) {
      for (const facing of IDENTITY_FACINGS) {
        const idle = identityFrameFile(person, facing, 'idle-1');
        const use = identityFrameFile(person, facing, 'use');
        if (person === 'player') {
          this.load.image(identityFrame.playerIdle(facing, 1), mineralUrl(idle));
          this.load.image(identityFrame.playerUse(facing), mineralUrl(use));
        } else {
          this.load.image(identityFrame.npcIdle(person, facing, 1), mineralUrl(idle));
          this.load.image(identityFrame.npcUse(person, facing), mineralUrl(use));
        }
      }
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
    for (const person of IDENTITY_PEOPLE) {
      for (const facing of IDENTITY_FACINGS) {
        if (person === 'player') {
          this.nearest(identityFrame.playerIdle(facing, 1));
          this.nearest(identityFrame.playerUse(facing));
        } else {
          this.nearest(identityFrame.npcIdle(person, facing, 1));
          this.nearest(identityFrame.npcUse(person, facing));
        }
      }
    }
    this.nearest('identity/contact-shadow.png');
    this.input.keyboard?.addCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE');
    this.keys = (this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;
    this.cameras.main.setBackgroundColor('#5c5348');
    this.cameras.main.roundPixels = true;
    this.input.on('pointerdown', () => {
      intent.interact = true;
    });
    this.scale.on('resize', () => this.frameCamera());
    this.events.once('shutdown', () => {
      this.input.keyboard?.removeAllKeys(true);
    });
    this.bootPlace();
  }

  private frameCamera(): void {
    const zoom = 2;
    this.cameras.main.setZoom(zoom);
    const worldW = this.place.width * TILE_SIZE;
    const worldH = this.place.height * TILE_SIZE;
    const padX = Math.max(0, this.scale.width / zoom - worldW) / 2;
    const padY = Math.max(0, this.scale.height / zoom - worldH) / 2;
    this.cameras.main.setBounds(-padX, -padY, worldW + padX * 2, worldH + padY * 2);
    if (this.body) this.lookAt(this.body.x, this.body.y);
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
    this.foreground = [];
    this.people = [];
    this.body?.destroy();
    this.rings?.destroy();
    this.body = null;
    this.shade = null;
    this.rings = null;
    this.place = locationById(session.world.locationId);
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
    const covered = coveredTiles(this.place);
    const fronts = entranceFronts(this.place);
    for (let y = 0; y < this.place.height; y += 1) {
      for (let x = 0; x < this.place.width; x += 1) {
        const tile = this.place.tiles[y]?.[x] ?? 0;
        if (tile === TILE.lantern || covered.has(`${x},${y}`)) continue;
        this.architecture(x, y, tile);
        if (tile === TILE.counter && displays.has(`${x},${y}`)) continue;
        if (tile === TILE.counter && !occupied.has(`${x},${y}`)) {
          this.overlay('furniture-pedestal', x, y);
          continue;
        }
        const key = OVERLAY[tile];
        if (key === 'awning' && fronts.has(`${x},${y}`)) continue;
        if (key) this.overlay(key, x, y);
      }
    }
    for (const actor of this.place.actors) {
      if (actor.form === 'person') {
        const key = `person-${actor.id}-${actor.facing}`;
        if (this.textures.exists(key)) {
          const feet = feetOf(actor.tx, actor.ty);
          this.shadowAt(feet.x, feet.y, feet.y - 2);
          const image = this.prop(key, actor.tx, actor.ty, 24, 32);
          this.people.push({ id: actor.id, facing: actor.facing, image });
        }
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
    for (const sheet of identitySheets(this.place)) this.addSheet(sheet);
    this.shade = this.shadowAt(session.world.x, session.world.y, session.world.y - 2);
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

  private prop(key: string, tx: number, ty: number, width: number, height: number): Phaser.GameObjects.Image {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y, key).setOrigin(0.5, 1).setDisplaySize(width, height).setDepth(feet.y);
    this.props.push(image);
    return image;
  }

  private shadowAt(x: number, y: number, depth: number): Phaser.GameObjects.Image | null {
    if (!this.textures.exists('identity/contact-shadow.png')) return null;
    const image = this.add.image(x, y, 'identity/contact-shadow.png').setOrigin(0.5, 0.5).setDisplaySize(32, 16).setDepth(depth);
    this.props.push(image);
    return image;
  }

  /** Slice a sheet into cells so a roof fades only where it covers the player. */
  private addSheet(sheet: IdentitySheet): void {
    if (!this.textures.exists(sheet.file)) return;
    this.nearest(sheet.file);
    const source = this.textures.get(sheet.file).getSourceImage() as CanvasImageSource;
    const cell = 64;
    for (let sy = 0; sy < sheet.sourceH; sy += cell) {
      for (let sx = 0; sx < sheet.sourceW; sx += cell) {
        const sw = Math.min(cell, sheet.sourceW - sx);
        const sh = Math.min(cell, sheet.sourceH - sy);
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const pen = canvas.getContext('2d');
        if (!pen) continue;
        pen.imageSmoothingEnabled = false;
        pen.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
        const data = pen.getImageData(0, 0, sw, sh).data;
        let opaque = 0;
        for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 16) opaque += 1;
        if (opaque < 8) continue;
        const key = `${sheet.id}-${sx}-${sy}`;
        this.texture(key, canvas);
        const left = sheet.worldX + (sx - sheet.anchorX) * IDENTITY_SCALE;
        const bottom = sheet.worldY + (sy + sh - sheet.anchorY) * IDENTITY_SCALE;
        const image = this.add.image(left, bottom, key).setOrigin(0, 1);
        image.setDisplaySize(sw * IDENTITY_SCALE, sh * IDENTITY_SCALE);
        image.setDepth(sheet.foreground ? bottom : sheet.depth);
        this.props.push(image);
        if (sheet.foreground) this.foreground.push(image);
      }
    }
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
    const shown = JSON.stringify(session.world.displays);
    if (this.place.id !== session.world.locationId || shown !== this.displayKey) {
      this.bootPlace();
      return;
    }
    this.drawRings(document.documentElement.classList.contains('reduce') ? 0 : this.time.now);
    this.posePeople();
    if (session.panel) {
      intent.interact = false;
      return;
    }
    const ix = (this.down('A') || this.down('LEFT') ? -1 : 0) + (this.down('D') || this.down('RIGHT') ? 1 : 0) + intent.x;
    const iy = (this.down('W') || this.down('UP') ? -1 : 0) + (this.down('S') || this.down('DOWN') ? 1 : 0) + intent.y;
    const step = wish(ix, iy, SPEED, delta / 1000);
    const next = move(this.place.solid, session.world.x, session.world.y, step.dx, step.dy, RADIUS);
    const facing = facingOf(step.dx, step.dy, session.world.facing);
    if (next.x !== session.world.x || next.y !== session.world.y) this.walked += Math.hypot(next.x - session.world.x, next.y - session.world.y);
    const moving = step.dx !== 0 || step.dy !== 0;
    const frame = moving ? Math.floor(this.walked / 8) % 4 : 0;
    session.world.x = next.x;
    session.world.y = next.y;
    session.world.facing = facing;
    const pose = this.time.now < this.useUntil ? identityFrame.playerUse(facing) : moving ? `you-${facing}-${frame}` : identityFrame.playerIdle(facing, (Math.floor(this.time.now / 1100) % 2) as 0 | 1);
    this.body.setPosition(Math.round(next.x), Math.round(next.y));
    if (this.textures.exists(pose)) this.body.setTexture(pose);
    this.body.setDisplaySize(24, 32);
    this.body.setDepth(next.y);
    this.shade?.setPosition(Math.round(next.x), Math.round(next.y));
    this.shade?.setDepth(next.y - 2);
    this.occlude();
    this.lookAt(next.x, next.y);
    this.seq += 1;
    if (this.seq % 30 === 0) transport.send({ locationId: this.place.id, x: next.x, y: next.y, facing, seq: this.seq });
    const here = tileAt(next.x, next.y - 10);
    const actor = nearest(this.place.actors, here.tx, here.ty);
    const exit = nearest(this.place.exits, here.tx, here.ty);
    const prompt = actor?.name ?? exit?.label ?? null;
    this.setPrompt(prompt ? `${prompt} · Use` : null);
    const pressed = intent.interact || this.just('E') || this.just('SPACE');
    if (!pressed) return;
    intent.interact = false;
    const target = actor ?? exit;
    if (target) {
      const look = facingToward(here.tx, here.ty, target.tx, target.ty, session.world.facing);
      session.world.facing = look;
      this.useUntil = this.time.now + 680;
      if (this.textures.exists(identityFrame.playerUse(look))) {
        this.body.setTexture(identityFrame.playerUse(look));
        this.body.setDisplaySize(24, 32);
      }
      if (actor?.form === 'person') {
        this.npcUntil.set(actor.id, this.time.now + 680);
        this.npcFace.set(actor.id, facingToward(actor.tx, actor.ty, here.tx, here.ty, actor.facing));
      }
    }
    if (actor) openWorldThing(actor);
    else if (exit) travelTo(exit.to, exit.spawn);
  }

  private posePeople(): void {
    for (const person of this.people) {
      const posing = this.time.now < (this.npcUntil.get(person.id) ?? 0);
      const facing = posing ? (this.npcFace.get(person.id) ?? person.facing) : person.facing;
      const frame = (Math.floor(this.time.now / 1100) % 2) as 0 | 1;
      const key = posing ? identityFrame.npcUse(person.id, facing) : identityFrame.npcIdle(person.id, facing, frame);
      if (!this.textures.exists(key)) continue;
      person.image.setTexture(key);
      person.image.setDisplaySize(24, 32);
    }
  }

  private occlude(): void {
    if (!this.body) return;
    const body = this.body.getBounds();
    for (const image of this.foreground) {
      const covers = image.depth > this.body.depth - 1 && Phaser.Geom.Intersects.RectangleToRectangle(body, image.getBounds());
      image.setAlpha(covers ? 0.42 : 1);
    }
  }

  private lookAt(x: number, y: number): void {
    const lift = this.scale.height < 520 ? 72 : 0;
    this.cameras.main.centerOn(Math.round(x), Math.round(y + lift));
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
