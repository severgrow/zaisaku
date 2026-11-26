/** Regional tints over the shared materials. One sprite can be recoloured by swapping this table. */

export interface RegionPalette {
  id: string;
  name: string;
  ground: string;
  groundDeep: string;
  path: string;
  pathDeep: string;
  vey: string;
  veyMid: string;
  veyShade: string;
  oru: string;
  oruMid: string;
  oruShade: string;
  sera: string;
  seraMid: string;
  seraShade: string;
  flora: string;
  floraDeep: string;
  ink: string;
  mist: string;
}

export const PALETTES: readonly RegionPalette[] = [
  {
    id: 'exchange',
    name: 'Exchange District',
    ground: '#8a7d6a',
    groundDeep: '#5c5348',
    path: '#cbb89a',
    pathDeep: '#a89878',
    vey: '#e6d7c3',
    veyMid: '#c9b59a',
    veyShade: '#8d7b68',
    oru: '#6d7550',
    oruMid: '#4c5340',
    oruShade: '#2e3328',
    sera: '#d29a3a',
    seraMid: '#a87428',
    seraShade: '#6e4c18',
    flora: '#7d8a62',
    floraDeep: '#3e4634',
    ink: '#1a1814',
    mist: '#d9d0c4',
  },
  {
    id: 'basin',
    name: 'Northern Basin',
    ground: '#6e7c86',
    groundDeep: '#3e4a52',
    path: '#b7c4c8',
    pathDeep: '#8ea0a6',
    vey: '#d5ddd8',
    veyMid: '#aeb8b4',
    veyShade: '#6e7874',
    oru: '#5e7a78',
    oruMid: '#3e5454',
    oruShade: '#243434',
    sera: '#c6a15a',
    seraMid: '#8e7040',
    seraShade: '#5a4830',
    flora: '#6a8a92',
    floraDeep: '#2e444c',
    ink: '#161a1c',
    mist: '#c5d0d4',
  },
  {
    id: 'industrial',
    name: 'Industrial Belt',
    ground: '#6a5348',
    groundDeep: '#3a2c28',
    path: '#b08978',
    pathDeep: '#8a6458',
    vey: '#d7c2b0',
    veyMid: '#a88b78',
    veyShade: '#6e5648',
    oru: '#6a7048',
    oruMid: '#4a4038',
    oruShade: '#2a2420',
    sera: '#d28a3a',
    seraMid: '#a85a28',
    seraShade: '#6e3018',
    flora: '#6e6840',
    floraDeep: '#3a3424',
    ink: '#1a1412',
    mist: '#cbb8aa',
  },
  {
    id: 'cultivation',
    name: 'Cultivation District',
    ground: '#7a8468',
    groundDeep: '#3e4634',
    path: '#d5cbb0',
    pathDeep: '#b0a488',
    vey: '#efe2cc',
    veyMid: '#d2c2a4',
    veyShade: '#8a7a62',
    oru: '#6a8070',
    oruMid: '#4a5c50',
    oruShade: '#2c3830',
    sera: '#d09868',
    seraMid: '#a87058',
    seraShade: '#6e4038',
    flora: '#8aaa78',
    floraDeep: '#3e5438',
    ink: '#161812',
    mist: '#e4dcc8',
  },
  {
    id: 'unmapped',
    name: 'Unmapped Territories',
    ground: '#6a6878',
    groundDeep: '#3a3844',
    path: '#b0a8b8',
    pathDeep: '#807888',
    vey: '#d4d0d8',
    veyMid: '#a8a0b0',
    veyShade: '#6e6874',
    oru: '#687880',
    oruMid: '#445058',
    oruShade: '#282c30',
    sera: '#c8a060',
    seraMid: '#887050',
    seraShade: '#504030',
    flora: '#708088',
    floraDeep: '#384048',
    ink: '#141418',
    mist: '#c8c4d0',
  },
];

export const paletteById = (id: string): RegionPalette => PALETTES.find((item) => item.id === id) ?? PALETTES[0]!;
