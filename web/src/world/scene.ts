import Phaser from 'phaser';
import { definition } from '../../../src/engine/definitions.js';
import { ARTWORK } from '../../../src/world/artwork.js';
import {
  DIAGONALS,
  DIRS,
  GLASS_CASE_PX,
  cornerDiagonal,
  eaveFiles,
  floorKey,
  floorMaterial,
  glassItemOffset,
  openingFile,
  pieceFile,
  stepOf,
  type Corner,
  type Dir,
  type FloorMaterial,
} from '../../../src/world/connectors.js';
import type { Fixture } from '../../../src/world/fixtures.js';
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
  EVERYDAY_FILES,
  MINERAL_TILES,
  NPCS,
  PLAYER_FACINGS,
  TRANSITION_FILES,
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
  private props: Phaser.GameObjects.Image[] = [];
  private foreground: Phaser.GameObjects.Image[] = [];
  private glow: Phaser.GameObjects.Graphics | null = null;
  private lamp: { x: number; y: number } | null = null;
  private rings: Phaser.GameObjects.Graphics | null = null;
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
      if (link.plateFile) this.load.image(`item-${link.definitionId}`, mineralUrl(link.plateFile));
    }
    for (const facing of PLAYER_FACINGS) {
      for (let frame = 0; frame < 4; frame += 1) this.load.image(`you-${facing}-${frame}`, mineralUrl(playerFile(facing, frame)));
    }
    for (const id of NPCS) {
      for (const facing of PLAYER_FACINGS) this.load.image(`person-${id}-${facing}`, mineralUrl(npcFile(id, facing)));
    }
    for (const [key, file] of Object.entries(EVERYDAY_FILES)) this.load.image(key, mineralUrl(file));
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
    for (const key of Object.keys(EVERYDAY_FILES)) this.nearest(key);
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
    this.glow?.destroy();
    this.glow = null;
    this.lamp = null;
    this.body?.destroy();
    this.rings?.destroy();
    this.body = null;
    this.rings = null;
    this.place = locationById(session.world.locationId);
    this.displayKey = this.watchKey();
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
        if (tile === TILE.awning) {
          this.overlay(this.tile(x, y + 1) === TILE.door ? 'awning-north-door.png' : 'awning', x, y);
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
        const owned = session.profile.inventory.find((item) => item.id === session.world.displays[slot]);
        const def = owned ? definition(owned.definitionId) : null;
        const picture = def ? this.pictureKey(def.id, def.category, palette) : null;
        if (slot === 'shelf-b') {
          this.glassCase(actor.tx, actor.ty, picture);
          continue;
        }
        this.prop('furniture-shelf', actor.tx, actor.ty, TILE_SIZE, TILE_SIZE);
        if (picture) this.itemOnShelf(picture, actor.tx, actor.ty);
      }
    }
    for (const fixture of this.place.fixtures) this.drawFixture(fixture);
    document.documentElement.dataset.anchors = this.props
      .map((image) => image.getData('anchor') as string | undefined)
      .filter((line): line is string => Boolean(line))
      .join(' ');
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
    return floorMaterial(this.place.id, this.tile(x, y));
  }

  private floorAt(x: number, y: number): string {
    const here = this.materialAt(x, y) ?? 'mineral-paving';
    const neighbors: Partial<Record<Dir, FloorMaterial | null>> = {};
    const diagonals: Partial<Record<Corner, FloorMaterial | null>> = {};
    for (const dir of DIRS) {
      const step = stepOf(dir);
      neighbors[dir] = this.materialAt(x + step.x, y + step.y);
    }
    for (const diag of DIAGONALS) diagonals[diag.corner] = this.materialAt(x + diag.x, y + diag.y);
    return floorKey(here, neighbors, diagonals);
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

  /** Perimeter walls, plus a door or window that continues a run so the frame meets the next piece. */
  private inWallMask(x: number, y: number): boolean {
    const tile = this.tile(x, y);
    if (tile === null) return false;
    if (tile === TILE.wall) return true;
    if (tile === TILE.interior || tile === TILE.pipe || tile === TILE.vent) return DIRS.some((dir) => !this.isStructure(x + stepOf(dir).x, y + stepOf(dir).y));
    if (tile === TILE.door || tile === TILE.window) return this.horizontalRun(x, y) || this.verticalRun(x, y);
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

  private openingFacing(x: number, y: number): 'e' | 'w' | null {
    const eastClosed = this.isStructure(x + 1, y);
    const westClosed = this.isStructure(x - 1, y);
    if (!eastClosed && westClosed) return 'e';
    if (!westClosed && eastClosed) return 'w';
    return null;
  }

  private architecture(x: number, y: number, tile: number): void {
    if (tile === TILE.roof) {
      const dirs = DIRS.filter((dir) => this.countsAsRoof(x + stepOf(dir).x, y + stepOf(dir).y));
      const eave = eaveFiles(dirs, this.countsAsRoof(x, y + 1));
      this.overlay(eave.roof ?? 'roof-straight-ew.png', x, y);
      if (eave.bridge) this.overlay('wall-straight-ew-top-bridge.png', x, y + 1);
    }
    const kind = tile === TILE.door ? 'door' : tile === TILE.window ? 'window' : null;
    let opening: string | null = null;
    if (kind && this.horizontalRun(x, y)) opening = openingFile(kind, ['e', 'w']);
    else if (kind && this.verticalRun(x, y)) {
      const facing = this.openingFacing(x, y);
      opening = facing ? openingFile(kind, ['n', 's'], facing) : null;
    }
    if (opening) {
      this.overlay(opening, x, y);
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

  private watchKey(): string {
    const auction = session.profile.auction;
    const lot = auction && auction.status === 'open' ? `${auction.id}:${auction.item.definitionId}` : '';
    return `${JSON.stringify(session.world.displays)}|${lot}`;
  }

  private cellSprite(key: string, tx: number, ty: number, depth: number, width: number, height: number): Phaser.GameObjects.Image | null {
    if (!this.textures.exists(key)) return null;
    const image = this.add.image(tx * TILE_SIZE + TILE_SIZE / 2, (ty + 1) * TILE_SIZE, key).setOrigin(0.5, 1);
    image.setDisplaySize(width, height);
    image.setDepth(depth);
    this.props.push(image);
    return image;
  }

  private drawFixture(fixture: Fixture): void {
    const floor = (fixture.ty + 1) * TILE_SIZE;
    const depth = fixture.role === 'threshold' ? 1 : fixture.role === 'terminal' ? floor + 6 : floor;
    const image = this.cellSprite(fixture.file, fixture.tx, fixture.ty, depth, fixture.w, fixture.h);
    if (!image) return;
    if (fixture.foreground) this.foreground.push(image);
    if (fixture.role === 'auction') this.drawAuctionLot(fixture, depth + 1);
    if (fixture.id === 'standing-lamp') {
      this.lamp = { x: fixture.tx * TILE_SIZE + TILE_SIZE / 2, y: (fixture.ty + 1) * TILE_SIZE };
      this.glow = this.add.graphics().setDepth(2);
    }
    image.setData('anchor', `${fixture.id}:${image.frame.width}x${image.frame.height}@${image.displayWidth}x${image.displayHeight}:${image.originX},${image.originY}`);
  }

  /** The stand stays empty until an open lot exists. The picture is the shared catalogue plate. */
  private drawAuctionLot(fixture: Fixture, depth: number): void {
    const auction = session.profile.auction;
    if (!auction || auction.status !== 'open') return;
    const key = `item-${auction.item.definitionId}`;
    if (!this.textures.exists(key)) return;
    const image = this.add.image(fixture.tx * TILE_SIZE + TILE_SIZE / 2, (fixture.ty + 1) * TILE_SIZE - 12, key).setOrigin(0.5, 1);
    image.setDisplaySize(16, 16);
    image.setDepth(depth);
    this.props.push(image);
  }

  private fadeForeground(): void {
    if (!this.body) return;
    const person = this.body.getBounds();
    for (const image of this.foreground) {
      const covers = image.depth >= this.body.depth && Phaser.Geom.Intersects.RectangleToRectangle(image.getBounds(), person);
      image.setAlpha(covers ? 0.42 : 1);
    }
  }

  private paintLamp(now: number): void {
    if (!this.glow || !this.lamp) return;
    const reduce = document.documentElement.classList.contains('reduce');
    const pulse = reduce ? 0.16 : 0.12 + 0.05 * (0.5 + 0.5 * Math.sin(now / 700));
    this.glow.clear();
    this.glow.fillStyle(0xd29a3a, pulse);
    this.glow.fillCircle(this.lamp.x, this.lamp.y - 20, 34);
  }

  private prop(key: string, tx: number, ty: number, width: number, height: number): void {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y, key).setOrigin(0.5, 1).setDisplaySize(width, height).setDepth(feet.y);
    this.props.push(image);
  }

  private pictureKey(definitionId: string, category: string, palette: ReturnType<typeof paletteById>): string {
    const key = `item-${definitionId}`;
    if (this.textures.exists(key)) return key;
    const painted = `plate-${category}`;
    if (!this.textures.exists(painted)) this.texture(painted, paintPlate(palette.sera, palette));
    return painted;
  }

  private itemOnShelf(key: string, tx: number, ty: number): void {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y - 14, key).setOrigin(0.5, 1).setDisplaySize(16, 16).setDepth(feet.y + 1);
    this.props.push(image);
  }

  /** Base, then the owned plate on the shelf line, then the clear glass rails. */
  private glassCase(tx: number, ty: number, picture: string | null): void {
    const feet = feetOf(tx, ty);
    const base = this.add.image(feet.x, feet.y, 'glass-case-base').setOrigin(0.5, 1).setDisplaySize(GLASS_CASE_PX, GLASS_CASE_PX).setDepth(feet.y);
    this.props.push(base);
    if (picture) {
      const offset = glassItemOffset(GLASS_CASE_PX);
      const item = this.add.image(feet.x + offset.x, feet.y + offset.y, picture).setOrigin(0.5, 1).setDisplaySize(offset.size, offset.size).setDepth(feet.y + 1);
      this.props.push(item);
    }
    const front = this.add.image(feet.x, feet.y, 'glass-case-front').setOrigin(0.5, 1).setDisplaySize(GLASS_CASE_PX, GLASS_CASE_PX).setDepth(feet.y + 2);
    this.props.push(front);
  }

  override update(_time: number, delta: number): void {
    if (this.samples < 40) {
      this.sampleMs += delta;
      this.samples += 1;
      if (this.samples === 40) document.documentElement.dataset.frameMs = (this.sampleMs / 40).toFixed(2);
    }
    if (!this.body) return;
    const shown = this.watchKey();
    if (this.place.id !== session.world.locationId || shown !== this.displayKey) {
      this.bootPlace();
      return;
    }
    const now = document.documentElement.classList.contains('reduce') ? 0 : this.time.now;
    this.drawRings(now);
    this.paintLamp(now);
    this.fadeForeground();
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
    const frame = step.dx === 0 && step.dy === 0 ? 0 : Math.floor(this.walked / 8) % 4;
    session.world.x = next.x;
    session.world.y = next.y;
    session.world.facing = facing;
    this.body.setPosition(Math.round(next.x), Math.round(next.y));
    this.body.setTexture(`you-${facing}-${frame}`);
    this.body.setDisplaySize(24, 32);
    this.body.setDepth(next.y);
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
    if (actor) openWorldThing(actor);
    else if (exit) travelTo(exit.to, exit.spawn);
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
