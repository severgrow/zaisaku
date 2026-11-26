/** Visual themes. Layout, rules, and prices do not read this file. */

export interface ThemeMaterials {
  bone: string;
  alloy: string;
  amber: string;
  burgundy: string;
  ink: string;
  ground: string;
}

export interface ThemeFrames {
  table: string;
  tableCompact: string;
  compartment: string;
  portrait: string;
  panel: string;
  envelope: string;
  receiver: string;
  sealed: string;
  hourglass: string;
  waveform: string;
  ring: string;
  terminal: string;
}

export interface ThemeLighting {
  key: string;
  ambient: string;
}

export interface VisualTheme {
  id: string;
  name: string;
  /** Region palette id already defined for the world. Null when this slot has no palette hook yet. */
  paletteId: string | null;
  implemented: boolean;
  materials: ThemeMaterials | null;
  frames: ThemeFrames | null;
  lighting: ThemeLighting | null;
  atmosphere: string;
}

const exchangeFrames: ThemeFrames = {
  table: 'exchange-table.png',
  tableCompact: 'exchange-compact.png',
  compartment: 'compartment-md.png',
  portrait: 'portrait-ornate.png',
  panel: 'panel-wide.png',
  envelope: 'envelope.png',
  receiver: 'receiver.png',
  sealed: 'sealed-closed.png',
  hourglass: 'hourglass.png',
  waveform: 'waveform.png',
  ring: 'amber-ring.png',
  terminal: 'duel-terminal.png',
};

/** The only implemented theme. The other ids are empty slots for a later material pass. */
export const VISUAL_THEMES: readonly VisualTheme[] = [
  {
    id: 'exchange-district',
    name: 'Exchange District',
    paletteId: 'exchange',
    implemented: true,
    materials: {
      bone: '#e6d7c3',
      alloy: '#6d7550',
      amber: '#d29a3a',
      burgundy: '#8d3d49',
      ink: '#1a1814',
      ground: '#141311',
    },
    frames: exchangeFrames,
    lighting: { key: '#d29a3a', ambient: '#2e3328' },
    atmosphere: 'Bone ceramic, green-grey alloy, amber lamps. A sealed exchange instrument.',
  },
  {
    id: 'northern-basin',
    name: 'Northern Basin',
    paletteId: 'basin',
    implemented: false,
    materials: null,
    frames: null,
    lighting: null,
    atmosphere: 'Slot only. A later pass may change materials, frames, lighting, and atmosphere.',
  },
  {
    id: 'industrial-belt',
    name: 'Industrial Belt',
    paletteId: 'industrial',
    implemented: false,
    materials: null,
    frames: null,
    lighting: null,
    atmosphere: 'Slot only. A later pass may change materials, frames, lighting, and atmosphere.',
  },
  {
    id: 'cultivation-district',
    name: 'Cultivation District',
    paletteId: 'cultivation',
    implemented: false,
    materials: null,
    frames: null,
    lighting: null,
    atmosphere: 'Slot only. A later pass may change materials, frames, lighting, and atmosphere.',
  },
  {
    id: 'unmapped-territories',
    name: 'Unmapped Territories',
    paletteId: 'unmapped',
    implemented: false,
    materials: null,
    frames: null,
    lighting: null,
    atmosphere: 'Slot only. A later pass may change materials, frames, lighting, and atmosphere.',
  },
];

export const ACTIVE_THEME_ID = 'exchange-district';

export const themeById = (id: string): VisualTheme => VISUAL_THEMES.find((theme) => theme.id === id) ?? VISUAL_THEMES[0]!;

export const activeTheme = (): VisualTheme => themeById(ACTIVE_THEME_ID);
