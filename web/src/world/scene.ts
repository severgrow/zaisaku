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

const transport = localTransport();
const SPEED = 88;
const RADIUS = 6;
const TALL = new Set<number>([TILE.roof, TILE.wall, TILE.window, TILE.door, TILE.counter, TILE.pipe, TILE.vent, TILE.tree, TILE.reed, TILE.vein, TILE.lantern, TILE.interior]);

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

  create(): void {
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

  private texture(key: string, canvas: HTMLCanvasElement): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
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
    for (let tile = 0; tile <= 15; tile += 1) this.texture(`${palette.id}-${tile}`, paintTile(tile, palette));
    for (const facing of ['n', 'e', 's', 'w'] as const) {
      for (let frame = 0; frame < 4; frame += 1) this.texture(`you-${facing}-${frame}`, paintActor(facing, frame, '#2c2824', 'visor', palette));
    }
    const ground = document.createElement('canvas');
    ground.width = this.place.width * TILE_SIZE;
    ground.height = this.place.height * TILE_SIZE;
    const pen = ground.getContext('2d');
    if (!pen) return;
    pen.imageSmoothingEnabled = false;
    const groundTile = this.textures.get(`${palette.id}-0`).getSourceImage() as CanvasImageSource;
    const pathTile = this.textures.get(`${palette.id}-1`).getSourceImage() as CanvasImageSource;
    for (let y = 0; y < this.place.height; y += 1) {
      for (let x = 0; x < this.place.width; x += 1) {
        const tile = this.place.tiles[y]?.[x] ?? 0;
        pen.drawImage(tile === TILE.path ? pathTile : groundTile, x * TILE_SIZE, y * TILE_SIZE);
        if (TALL.has(tile) || tile === TILE.ground || tile === TILE.path) continue;
        const source = this.textures.get(`${palette.id}-${tile}`).getSourceImage() as CanvasImageSource;
        pen.drawImage(source, x * TILE_SIZE, y * TILE_SIZE);
      }
    }
    this.texture(`ground-${this.place.id}`, ground);
    const base = this.add.image(0, 0, `ground-${this.place.id}`).setOrigin(0, 0).setDepth(0);
    this.props.push(base);
    for (let y = 0; y < this.place.height; y += 1) {
      for (let x = 0; x < this.place.width; x += 1) {
        const tile = this.place.tiles[y]?.[x] ?? 0;
        if (!TALL.has(tile)) continue;
        const image = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, (y + 1) * TILE_SIZE, `${palette.id}-${tile}`).setOrigin(0.5, 1);
        image.setDepth((y + 1) * TILE_SIZE);
        this.props.push(image);
      }
    }
    for (const actor of this.place.actors) {
      if (actor.form === 'person') {
        const key = `npc-${actor.id}`;
        this.texture(key, paintActor(actor.facing, 0, actor.coat, actor.accessory, palette));
        this.prop(key, actor.tx, actor.ty);
      } else if (actor.form === 'furnishing' && actor.slot) {
        const slot = actor.slot;
        const owned = session.profile.inventory.find((item) => item.id === session.world.displays[slot]);
        if (owned) {
          const def = definition(owned.definitionId);
          const key = `plate-${def.category}`;
          if (!this.textures.exists(key)) this.texture(key, paintPlate(palette.sera, palette));
          this.prop(key, actor.tx, actor.ty);
        }
      }
    }
    this.body = this.add.image(session.world.x, session.world.y, `you-${session.world.facing}-0`).setOrigin(0.5, 1);
    this.body.setDepth(session.world.y);
    this.rings = this.add.graphics();
    this.frameCamera();
    this.setPrompt(null);
  }

  private prop(key: string, tx: number, ty: number): void {
    const feet = feetOf(tx, ty);
    const image = this.add.image(feet.x, feet.y, key).setOrigin(0.5, 1).setDepth(feet.y);
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
