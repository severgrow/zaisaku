import { hashString } from '../../../src/engine/prng.js';

const ACCENT: Record<string, string> = {
  electronics: '#5f8f8a',
  timekeeping: '#c4963a',
  optical: '#e7e1d6',
  ceramics: '#8d3d49',
  curiosities: '#6e7544',
  magical: '#8d3d49',
};

const wrap = (body: string): string =>
  `<svg class="art" viewBox="0 0 64 64" aria-hidden="true"><rect x="1" y="1" width="62" height="62" fill="#221f1b" stroke="#3c362e"/>${body}</svg>`;

const CUSTOM: Record<string, string> = {
  'tomorrow-receiver': `<rect x="12" y="20" width="40" height="24" rx="2" fill="none" stroke="#5f8f8a"/><circle cx="22" cy="32" r="5" fill="none" stroke="#e7e1d6"/><path d="M34 28h12M34 32h10M34 36h8" stroke="#c4963a"/><path d="M18 18c6-6 14-6 20 0" fill="none" stroke="#5f8f8a"/>`,
  'dream-receiver': `<rect x="14" y="22" width="36" height="22" fill="none" stroke="#8d3d49"/><path d="M20 30c4 4 8 4 12 0s8-4 12 0" fill="none" stroke="#e7e1d6"/><circle cx="32" cy="18" r="2" fill="#c4963a"/>`,
  'null-magnet': `<path d="M20 44V28a12 12 0 0 1 24 0v16" fill="none" stroke="#5f8f8a" stroke-width="4"/><path d="M18 44h8M38 44h8" stroke="#e7e1d6"/>`,
  'silent-telephone': `<path d="M18 22c8 2 20 2 28 0v6c-8 2-20 2-28 0z" fill="none" stroke="#e7e1d6"/><path d="M22 28v14M42 28v14" stroke="#5f8f8a"/><path d="M18 42c8-2 20-2 28 0" fill="none" stroke="#e7e1d6"/>`,
  'moon-clock': `<circle cx="32" cy="32" r="14" fill="none" stroke="#c4963a"/><path d="M32 32V22M32 32l8 5" stroke="#e7e1d6"/><path d="M44 18a8 8 0 1 0 0 12 6 6 0 1 1 0-12z" fill="#e7e1d6"/>`,
  'amber-hourglass': `<path d="M22 14h20L32 32 42 50H22L32 32z" fill="none" stroke="#c4963a"/><path d="M26 46h12" stroke="#8d3d49"/>`,
  'memory-lens': `<ellipse cx="32" cy="32" rx="16" ry="12" fill="none" stroke="#e7e1d6"/><ellipse cx="32" cy="32" rx="6" ry="6" fill="none" stroke="#5f8f8a"/><path d="M24 26l4 2" stroke="#c4963a"/>`,
  'orchid-vessel': `<path d="M26 18h12l4 14c2 10-2 16-10 16s-12-6-10-16z" fill="none" stroke="#8d3d49"/><path d="M32 18c2-6 8-8 10-6" fill="none" stroke="#6e7544"/>`,
  'red-box': `<rect x="16" y="20" width="32" height="26" fill="none" stroke="#8d3d49"/><circle cx="32" cy="33" r="4" fill="none" stroke="#c4963a"/><path d="M16 26h32" stroke="#8d3d49"/>`,
  'twin-left': `<circle cx="24" cy="22" r="5" fill="none" stroke="#e7e1d6"/><path d="M24 28v12M18 34h12M20 40l4 8M28 40l-4 8" stroke="#6e7544"/>`,
  'twin-right': `<circle cx="40" cy="22" r="5" fill="none" stroke="#e7e1d6"/><path d="M40 28v12M34 34h12M36 40l4 8M44 40l-4 8" stroke="#6e7544"/>`,
};

const generated = (ref: string, category: string): string => {
  const accent = ACCENT[category] ?? '#c4963a';
  const h = hashString(ref);
  const kind = h % 5;
  if (kind === 0) return `<rect x="18" y="18" width="28" height="28" fill="none" stroke="${accent}"/><path d="M18 32h28M32 18v28" stroke="#e7e1d6" opacity="0.7"/>`;
  if (kind === 1) return `<circle cx="32" cy="30" r="12" fill="none" stroke="${accent}"/><rect x="24" y="42" width="16" height="6" fill="none" stroke="#e7e1d6"/>`;
  if (kind === 2) return `<path d="M20 46 L32 16 L44 46z" fill="none" stroke="${accent}"/><path d="M26 36h12" stroke="#e7e1d6"/>`;
  if (kind === 3) return `<rect x="16" y="26" width="32" height="16" rx="8" fill="none" stroke="${accent}"/><circle cx="26" cy="34" r="2" fill="#e7e1d6"/><circle cx="38" cy="34" r="2" fill="#e7e1d6"/>`;
  return `<path d="M32 14v36M18 24c8 8 20 8 28 0M18 42c8-8 20-8 28 0" fill="none" stroke="${accent}"/>`;
};

export const plate = (ref: string, category: string): string => wrap(CUSTOM[ref] ?? generated(ref, category));
