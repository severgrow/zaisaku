import Phaser from 'phaser';
import { definition } from '../../../src/engine/definitions.js';
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
import { MINERAL_TILES, NPCS, PLAYER_FACINGS, mineralUrl, npcFile, playerFile } from './mineral.js';

const transport = localTransport();
const SPEED = 88;
const RADIUS = 6;
const MASS = new Set<number>([TILE.roof, TILE.wall, TILE.interior, TILE.door, TILE.window]);
const WALK = new Set<number>([TILE.ground, TILE.path, TILE.awning, TILE.lamp]);
const OVERLAY: Readonly<Record<number, string>> = {
  [TILE.door]: 'door',
  [TILE.window]: 'window',
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

  constructor() {
    super('district');
  }

  preload(): void {
    for (const [key, file] of Object.entries(MINERAL_TILES)) this.load.image(key, mineralUrl(file));
    for (const facing of PLAYER_FACINGS) {
      for (let frame = 0; frame < 4; frame += 1) this.load.image(`you-${facing}-${frame}`, mineralUrl(playerFile(facing, frame)));
    }
    for (const id of NPCS) {
      for (const facing of PLAYER_FACINGS) this.load.image(`person-${id}-${facing}`, mineralUrl(npcFile(id, facing)));
    }
  }

  create(): void {
    for (const key of Object.keys(MINERAL_TILES)) this.nearest(key);
    for (const facing of PLAYER_FACINGS) {
      for (let frame = 0; frame < 4; frame += 1) this.nearest(`you-${facing}-${frame}`);
      for (const id of NPCS) this.nearest(`person-${id}-${facing}`);
    }
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
    this.body?.destroy();
    this.rings?.destroy();
    this.body = null;
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
        const tile = this.place.tiles[y]?.[x] ?? 0;
        const source = this.sheet(this.baseKey(tile, x, y));
        if (source) pen.drawImage(source, x * TILE_SIZE * draw, y * TILE_SIZE * draw, TILE_SIZE * draw, TILE_SIZE * draw);
      }
    }
    this.texture(`ground-${this.place.id}`, ground);
    const base = this.add.image(0, 0, `ground-${this.place.id}`).setOrigin(0, 0).setDepth(0);
    base.setDisplaySize(this.place.width * TILE_SIZE, this.place.height * TILE_SIZE);
    this.props.push(base);
    for (let y = 0; y < this.place.height; y += 1) {
      for (let x = 0; x < this.place.width; x += 1) {
        const tile = this.place.tiles[y]?.[x] ?? 0;
        const above = this.place.tiles[y - 1]?.[x];
        if (tile === TILE.roof && above !== TILE.roof) this.overlay('roof', x, y);
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
        if (owned) {
          const def = definition(owned.definitionId);
          const key = `plate-${def.category}`;
          if (!this.textures.exists('plate')) this.texture(key, paintPlate(palette.sera, palette));
          this.prop(this.textures.exists('plate') ? 'plate' : key, actor.tx, actor.ty, 28, 28);
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

  private baseKey(tile: number, x: number, y: number): string {
    if (tile === TILE.path) return 'path';
    if (tile === TILE.awning || tile === TILE.lamp) return 'ground';
    if (tile === TILE.pipe || tile === TILE.vent) return 'stone';
    if (this.place.id === 'residence' && (tile === TILE.ground || tile === TILE.counter || tile === TILE.lantern)) return 'stone';
    if (MASS.has(tile)) {
      const edge = x === 0 || y === 0 || x === this.place.width - 1 || y === this.place.height - 1;
      const south = this.place.tiles[y + 1]?.[x];
      if (!edge && tile !== TILE.roof && south !== undefined && WALK.has(south)) return 'interior';
      return 'stone';
    }
    return 'ground';
  }

  private overlay(key: string, x: number, y: number): void {
    if (!this.textures.exists(key)) return;
    const image = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, (y + 1) * TILE_SIZE, key).setOrigin(0.5, 1);
    image.setDisplaySize(TILE_SIZE, TILE_SIZE);
    image.setDepth((y + 1) * TILE_SIZE);
    this.props.push(image);
  }

  private ensureFallback(palette: ReturnType<typeof paletteById>): void {
    if (this.textures.exists('ground')) return;
    this.texture('ground', paintTile(TILE.ground, palette));
    this.texture('path', paintTile(TILE.path, palette));
    this.texture('stone', paintTile(TILE.interior, palette));
    this.texture('interior', paintTile(TILE.interior, palette));
  }

  private prop(key: string, tx: number, ty: number, width: number, height: number): void {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y, key).setOrigin(0.5, 1).setDisplaySize(width, height).setDepth(feet.y);
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
