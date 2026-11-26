import type { RegionPalette } from '../../../src/world/palettes.js';
import type { Facing } from '../../../src/world/types.js';

/** Temporary procedural stand-ins. Not approved production art. Same perspective for every sprite: front and roof visible, feet at the bottom. */

const make = (width: number, height: number): { canvas: HTMLCanvasElement; pen: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pen = canvas.getContext('2d');
  if (!pen) throw new Error('canvas');
  pen.imageSmoothingEnabled = false;
  return { canvas, pen };
};

const box = (pen: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void => {
  pen.fillStyle = color;
  pen.fillRect(x, y, w, h);
};

export const paintTile = (tile: number, palette: RegionPalette): HTMLCanvasElement => {
  const { canvas, pen } = make(32, 32);
  const ground = () => {
    box(pen, 0, 0, 32, 32, palette.ground);
  };
  if (tile === 0) ground();
  else if (tile === 1) {
    box(pen, 0, 0, 32, 32, palette.path);
  } else if (tile === 2) {
    box(pen, 0, 0, 32, 32, palette.oruShade);
    box(pen, 2, 8, 28, 24, palette.oruMid);
    box(pen, 6, 2, 20, 10, palette.oru);
  } else if (tile === 3 || tile === 15) {
    box(pen, 0, 0, 32, 32, tile === 15 ? palette.veyMid : palette.vey);
    box(pen, 0, 26, 32, 6, palette.veyShade);
    box(pen, 6, 8, 4, 10, palette.veyShade);
  } else if (tile === 4) {
    box(pen, 0, 0, 32, 32, palette.vey);
    box(pen, 8, 8, 16, 16, palette.ink);
    box(pen, 12, 12, 8, 8, palette.sera);
  } else if (tile === 5) {
    box(pen, 0, 0, 32, 32, palette.vey);
    box(pen, 4, 0, 24, 6, palette.oru);
    box(pen, 10, 8, 12, 20, palette.oruShade);
    box(pen, 14, 16, 4, 6, palette.sera);
  } else if (tile === 6) {
    ground();
    box(pen, 0, 0, 32, 6, palette.oru);
  } else if (tile === 7) {
    box(pen, 0, 8, 32, 24, palette.oruMid);
    box(pen, 2, 4, 28, 8, palette.vey);
  } else if (tile === 8) {
    box(pen, 0, 0, 32, 32, palette.oruShade);
    box(pen, 6, 10, 20, 8, palette.oru);
  } else if (tile === 9) {
    box(pen, 0, 0, 32, 32, palette.veyMid);
    box(pen, 6, 8, 6, 12, palette.ink);
    box(pen, 16, 8, 6, 12, palette.ink);
  } else if (tile === 10) {
    box(pen, 14, 10, 4, 22, palette.oruShade);
    box(pen, 8, 4, 16, 8, palette.sera);
  } else if (tile === 11) {
    box(pen, 14, 18, 4, 14, palette.oruShade);
    box(pen, 4, 12, 24, 6, palette.flora);
    box(pen, 8, 6, 16, 6, palette.floraDeep);
    box(pen, 12, 2, 8, 4, palette.flora);
  } else if (tile === 12) {
    box(pen, 6, 8, 4, 24, palette.vey);
    box(pen, 14, 4, 4, 28, palette.oru);
    box(pen, 22, 10, 4, 22, palette.veyMid);
  } else if (tile === 13) {
    box(pen, 16, 16, 4, 16, palette.floraDeep);
    box(pen, 8, 10, 12, 4, palette.flora);
    box(pen, 20, 8, 8, 4, palette.seraMid);
    box(pen, 6, 18, 8, 4, palette.flora);
  } else if (tile === 14) {
    box(pen, 14, 16, 4, 16, palette.oruShade);
    box(pen, 8, 6, 16, 12, palette.floraDeep);
    box(pen, 12, 8, 8, 6, palette.sera);
  }
  return canvas;
};

export const paintActor = (
  facing: Facing,
  frame: number,
  coat: string,
  accessory: 'none' | 'visor' | 'hood',
  palette: RegionPalette,
): HTMLCanvasElement => {
  const { canvas, pen } = make(24, 32);
  const step = frame % 2 === 1 ? 2 : 0;
  const skin = palette.mist;
  const leg = palette.ink;
  if (facing === 'n') {
    box(pen, 8, 4, 8, 8, accessory === 'hood' ? coat : skin);
    box(pen, 6, 12, 12, 10, coat);
    box(pen, 7, 22, 4, 8 + (step ? -2 : 0), leg);
    box(pen, 13, 22 + step, 4, 8, leg);
  } else if (facing === 'w' || facing === 'e') {
    const flip = facing === 'w';
    const r = (px: number, py: number, w: number, h: number, color: string) => box(pen, flip ? 24 - (px + w) : px, py, w, h, color);
    r(8, 4, 8, 8, accessory === 'hood' ? coat : skin);
    if (accessory === 'visor') r(8, 7, 6, 2, palette.sera);
    r(7, 12, 10, 10, coat);
    r(8, 22, 3, 8, leg);
    r(13, 22 + step, 3, 8 - step, leg);
  } else {
    box(pen, 8, 4, 8, 8, accessory === 'hood' ? coat : skin);
    if (accessory === 'visor') box(pen, 8, 7, 8, 2, palette.sera);
    else box(pen, 10, 8, 4, 2, palette.ink);
    box(pen, 6, 12, 12, 10, coat);
    box(pen, 7, 22, 4, 8, leg);
    box(pen, 13, 22 + (frame === 1 || frame === 2 ? 2 : 0), 4, 8, leg);
  }
  return canvas;
};

export const paintPlate = (color: string, palette: RegionPalette): HTMLCanvasElement => {
  const { canvas, pen } = make(32, 32);
  box(pen, 6, 8, 20, 16, palette.vey);
  box(pen, 10, 12, 12, 8, color);
  return canvas;
};
