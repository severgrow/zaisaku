/** Provisional native materials. Visual palette plus extensible mechanics metadata. Scenes read this table; they do not invent material rules. */

export interface MaterialDef {
  id: 'vey' | 'oru' | 'sera';
  name: string;
  summary: string;
  light: string;
  base: string;
  mid: string;
  shade: string;
  living: boolean;
  structural: boolean;
  resonant: boolean;
  uses: readonly string[];
}

export const MATERIALS: readonly MaterialDef[] = [
  {
    id: 'vey',
    name: 'Vey',
    summary: 'Living ivory ceramic. Smooth, rounded, sometimes faintly branched.',
    light: '#f3eadf',
    base: '#e6d7c3',
    mid: '#c9b59a',
    shade: '#8d7b68',
    living: true,
    structural: true,
    resonant: false,
    uses: ['buildings', 'furniture', 'domestic objects'],
  },
  {
    id: 'oru',
    name: 'Oru',
    summary: 'Green mineral alloy. Geometric, used where something must hold.',
    light: '#8a9364',
    base: '#6d7550',
    mid: '#4c5340',
    shade: '#2e3328',
    living: false,
    structural: true,
    resonant: false,
    uses: ['machinery', 'infrastructure', 'supports', 'containers'],
  },
  {
    id: 'sera',
    name: 'Sera',
    summary: 'Amber resonant matter. It is stored in chambers and sometimes gives off light.',
    light: '#e6c36a',
    base: '#d29a3a',
    mid: '#a87428',
    shade: '#6e4c18',
    living: false,
    structural: false,
    resonant: true,
    uses: ['energy', 'instruments', 'unusual objects'],
  },
];

export const materialById = (id: MaterialDef['id']): MaterialDef => MATERIALS.find((item) => item.id === id)!;
