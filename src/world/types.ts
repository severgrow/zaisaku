import type { Fixture } from './fixtures.js';
import type { Shell } from './stamp.js';

export type Facing = 'n' | 'e' | 's' | 'w';

export type InteractionKind =
  | 'merchant'
  | 'auction'
  | 'research'
  | 'contract'
  | 'duel'
  | 'terminal'
  | 'storage'
  | 'display'
  | 'rest'
  | 'flora'
  | 'resonance';

export type SymbolId =
  | 'exchange'
  | 'storage'
  | 'research'
  | 'transit'
  | 'resonance'
  | 'residence'
  | 'auction'
  | 'manufacturing'
  | 'cultivation'
  | 'contract';

export interface WorldState {
  locationId: string;
  x: number;
  y: number;
  facing: Facing;
  displays: Record<string, string | null>;
  discovered: string[];
  flags: Record<string, boolean>;
}

export interface Spawn {
  tx: number;
  ty: number;
  facing: Facing;
}

export interface ActorDef {
  id: string;
  name: string;
  tx: number;
  ty: number;
  facing: Facing;
  kind: InteractionKind;
  symbol: SymbolId;
  form: 'person' | 'terminal' | 'flora' | 'furnishing';
  coat: string;
  accessory: 'none' | 'visor' | 'hood';
  line: string;
  slot: string | null;
}

export interface ExitDef {
  id: string;
  tx: number;
  ty: number;
  to: string;
  spawn: string;
  label: string;
  symbol: SymbolId;
}

export interface LocationDef {
  id: string;
  name: string;
  paletteId: string;
  width: number;
  height: number;
  tiles: number[][];
  solid: boolean[][];
  spawns: Record<string, Spawn>;
  exits: ExitDef[];
  actors: ActorDef[];
  /** Props, thresholds and foreground. Footprints are already copied into `solid`. */
  fixtures: readonly Fixture[];
  buildings?: readonly (Shell & { id: string })[];
  resonance: { tx: number; ty: number } | null;
  audioBed: string | null;
  blurb: string;
}
