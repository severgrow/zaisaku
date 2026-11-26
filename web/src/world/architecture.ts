import type { Shell } from '../../../src/world/stamp.js';
import { TILE_SIZE } from '../../../src/world/tiles.js';

const MODULAR_FINISHES = {
  duel: { edge: '#6f6b55', top: '#8a866e', inset: '#536052', face: '#4c5547', pin: '#cfb076' },
  auction: { edge: '#8b7264', top: '#a18b77', inset: '#62504b', face: '#64524d', pin: '#d1ae7d' },
  residence: { edge: '#91846c', top: '#b0a387', inset: '#737565', face: '#6b624e', pin: '#ccb583' },
};

/** Pixel-stepped casing profiles for connected roof and foundation courses. */
const insetCase = (pen: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string | CanvasGradient): void => {
  pen.fillStyle = color;
  pen.fillRect(x + 8, y, w - 16, h);
  pen.fillRect(x + 3, y + 3, w - 6, h - 6);
  pen.fillRect(x, y + 8, w, h - 16);
};

/** The shell is drawn in the map's actual orientation. The existing oriented wall apertures are separate. */
export const paintModularShell = (shell: Shell, id: keyof typeof MODULAR_FINISHES): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const w = shell.w * TILE_SIZE;
  const h = shell.h * TILE_SIZE;
  canvas.width = w;
  canvas.height = h;
  const pen = canvas.getContext('2d')!;
  const finish = MODULAR_FINISHES[id];
  const rect = (color: string, x: number, y: number, width: number, height: number) => {
    pen.fillStyle = color;
    pen.fillRect(x, y, width, height);
  };
  insetCase(pen, 1, 6, w - 2, h - 7, '#373a31');
  insetCase(pen, 3, 4, w - 6, h - 11, finish.face);
  insetCase(pen, 4, 1, w - 8, h - 37, finish.edge);
  insetCase(pen, 7, 2, w - 14, h - 46, finish.top);
  rect('#ffffff28', 15, 3, w - 30, 2);
  rect('#191c1890', 9, h - 39, w - 18, 3);
  rect('#c6a77a28', 10, h - 33, w - 20, 2);
  rect('#e1cba24a', 10, h - 12, w - 20, 2);
  // Roof course seams and service hatches use the same grid for each finish.
  for (let x = 26; x < w - 22; x += 33) {
    rect('#211e182c', x, 8, 1, h - 57);
    rect('#f6e7be25', x + 1, 8, 1, h - 57);
  }
  if (id === 'duel') {
    insetCase(pen, 20, 20, w - 57, 74, '#363d34');
    insetCase(pen, 23, 22, w - 63, 61, finish.inset);
    rect('#c8b78965', 33, 25, w - 83, 2);
    for (let x = 40; x < w - 45; x += 18) {
      rect('#2d362e', x, 37, 12, 35);
      rect('#8e936b', x + 2, 38, 1, 31);
    }
    rect(finish.pin, w - 53, 65, 9, 2);
  } else if (id === 'auction') {
    insetCase(pen, 48, 13, w - 64, 82, '#514c42');
    insetCase(pen, 52, 16, w - 72, 74, finish.inset);
    insetCase(pen, 57, 20, w - 82, 62, '#8a7062');
    rect('#d1ac8266', 66, 22, w - 103, 2);
    for (let y = 38; y < 75; y += 10) rect('#403b34aa', 71, y, w - 115, 3);
  } else {
    insetCase(pen, 19, 25, w - 38, 53, '#6e6852');
    insetCase(pen, 21, 25, w - 42, 46, finish.inset);
    for (let x = 35; x < w - 32; x += 26) rect('#a29a714d', x, 33, 2, 30);
    for (const x of [28, w - 72]) {
      rect('#39392e', x, h - 33, 43, 15);
      rect('#816646', x + 3, h - 30, 37, 8);
      rect(finish.pin, x + 6, h - 29, 31, 2);
      rect('#403b31', x + 19, h - 30, 3, 10);
    }
    // Recess seen from north. The sill is in front of the back-facing roof cap.
    const center = (shell.doorTx - shell.x) * TILE_SIZE + TILE_SIZE / 2;
    rect('#353d33', center - 19, 0, 38, 28);
    rect('#9c8364', center - 15, 0, 30, 4);
    rect('#c5a778', center - 12, 4, 24, 2);
    rect('#5c503b', center - 12, 7, 24, 15);
    rect('#302c24', center - 2, 7, 3, 15);
    rect('#b89658', center + 4, 14, 5, 2);
    rect('#c1a87e', center - 17, 24, 34, 3);
  }
  // Upper light and darker lower courses give the enclosure a rounded mineral section.
  const roofLight = pen.createLinearGradient(0, 3, 0, h - 34);
  roofLight.addColorStop(0, '#f8e9c151');
  roofLight.addColorStop(0.36, '#f5dfb809');
  roofLight.addColorStop(1, '#282c262f');
  insetCase(pen, 7, 2, w - 14, h - 42, roofLight);
  const faceLight = pen.createLinearGradient(0, h - 35, 0, h - 4);
  faceLight.addColorStop(0, '#191c1748');
  faceLight.addColorStop(0.34, '#e0c3a022');
  faceLight.addColorStop(1, '#26221b80');
  pen.fillStyle = faceLight;
  pen.fillRect(7, h - 37, w - 14, 31);
  for (let x = 18; x < w - 14; x += 36) {
    rect('#211d1a50', x, h - 30, 1, 19);
    rect('#d9bb8a4b', x + 1, h - 26, 1, 15);
  }
  // Low contrast mineral inclusions stay inside the ceramic casing.
  let seed = w * 7 + h + id.length;
  for (let index = 0; index < w * h / 26; index += 1) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    const x = 10 + (seed >>> 16) % (w - 20);
    const y = 9 + (seed & 0xffff) % (h - 22);
    rect(index % 3 === 0 ? '#332e241d' : '#ebe1bb1d', x, y, index % 7 === 0 ? 3 : 1, 1);
  }
  if (shell.facing !== 'n') {
    const portalY = (shell.doorTy - shell.y) * TILE_SIZE;
    const x = shell.facing === 'e' ? w - 18 : 0;
    rect('#282e29', x, portalY - 3, 18, 35);
    rect('#b7a17c', x, portalY - 4, 18, 3);
    rect('#946e43', x, portalY + 24, 18, 3);
  }
  return canvas;
};
