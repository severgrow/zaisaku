import { replayDuel } from '../engine/duel.js';
import { rulesFor } from '../engine/rules.js';
import { credit, createProfile } from '../economy/profile.js';
import type { DuelState, MatchResult, Profile } from '../engine/types.js';
import { reconcileDisplays, defaultWorld } from '../world/state.js';
import type { Facing, WorldState } from '../world/types.js';

export const SAVE_VERSION = 2;

export interface Settings {
  reducedMotion: 'system' | 'reduce' | 'allow';
  sound: boolean;
  largeText: boolean;
}

export interface SaveFile {
  version: 2;
  revision: number;
  writer: string;
  profile: Profile;
  duel: DuelState | null;
  settings: Settings;
  lastResult: MatchResult | null;
  world: WorldState;
}

export const defaultSettings = (): Settings => ({ reducedMotion: 'system', sound: false, largeText: false });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const ledgerOk = (profile: Profile): boolean => {
  if (profile.version !== 1) return false;
  const wallets = profile.wallets;
  if (!wallets || !Number.isInteger(wallets.permanent) || !Number.isInteger(wallets.reserved) || wallets.cosmetic !== 0) return false;
  if (wallets.permanent < 0 || wallets.reserved < 0 || wallets.reserved > wallets.permanent) return false;
  if (!Array.isArray(profile.ledger) || !Array.isArray(profile.inventory) || !Array.isArray(profile.listings)) return false;
  const sum = profile.ledger.reduce((total, entry) => total + (Number.isInteger(entry?.amount) ? entry.amount : Number.NaN), 0);
  if (sum !== wallets.permanent) return false;
  const ids = [...profile.inventory, ...profile.listings].map((item) => item?.id);
  if (ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length) return false;
  return typeof profile.name === 'string' && Number.isInteger(profile.seed);
};

const reviveDuel = (duel: DuelState): DuelState | null => {
  try {
    if (!rulesFor(duel.rulesVersion) || !Array.isArray(duel.actionLog)) return null;
    return replayDuel(duel.seed, duel.actionLog, {
      rules: duel.rules,
      names: [duel.players.p0.name, duel.players.p1.name],
      simulated: [duel.players.p0.simulated, duel.players.p1.simulated],
    });
  } catch {
    return null;
  }
};

export const encodeSave = (save: SaveFile): string => JSON.stringify(save);

const FACING: readonly Facing[] = ['n', 'e', 's', 'w'];

const parseWorld = (value: unknown, ownedIds: readonly string[]): WorldState => {
  const base = defaultWorld();
  if (!isRecord(value)) return base;
  const facing = FACING.includes(value.facing as Facing) ? (value.facing as Facing) : base.facing;
  const displays = isRecord(value.displays) ? (value.displays as Record<string, string | null>) : base.displays;
  const discovered = Array.isArray(value.discovered) ? value.discovered.filter((item): item is string => typeof item === 'string') : base.discovered;
  const flags: Record<string, boolean> = {};
  if (isRecord(value.flags)) {
    for (const [key, flag] of Object.entries(value.flags)) if (flag === true) flags[key] = true;
  }
  return {
    locationId: typeof value.locationId === 'string' && value.locationId ? value.locationId : base.locationId,
    x: typeof value.x === 'number' && Number.isFinite(value.x) ? value.x : base.x,
    y: typeof value.y === 'number' && Number.isFinite(value.y) ? value.y : base.y,
    facing,
    displays: reconcileDisplays({ ...base.displays, ...displays }, ownedIds),
    discovered: discovered.length ? discovered : base.discovered,
    flags,
  };
};

export const chooseSave = (memoryRevision: number, stored: SaveFile | null): 'keep' | 'adopt' =>
  stored && stored.revision > memoryRevision ? 'adopt' : 'keep';

export const decodeSave = (raw: string | null): SaveFile | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version === 0) return migrateV0(parsed);
    if ((parsed.version !== 1 && parsed.version !== 2) || !isRecord(parsed.profile)) return null;
    const profile = parsed.profile as unknown as Profile;
    if (!ledgerOk(profile)) return null;
    const duel = isRecord(parsed.duel) ? reviveDuel(parsed.duel as unknown as DuelState) : null;
    const settings = isRecord(parsed.settings) ? (parsed.settings as unknown as Settings) : defaultSettings();
    const lastResult = isRecord(parsed.lastResult) ? (parsed.lastResult as unknown as MatchResult) : null;
    const owned = profile.inventory.map((item) => item.id);
    return {
      version: 2,
      revision: Number.isInteger(parsed.revision) ? (parsed.revision as number) : 0,
      writer: typeof parsed.writer === 'string' ? parsed.writer : '',
      profile,
      duel,
      settings: { ...defaultSettings(), ...settings },
      lastResult,
      world: parseWorld(parsed.world, owned),
    };
  } catch {
    return null;
  }
};

const migrateV0 = (raw: Record<string, unknown>): SaveFile | null => {
  if (typeof raw.name !== 'string' || !Number.isInteger(raw.permanent) || (raw.permanent as number) < 0) return null;
  const seed = Number.isInteger(raw.seed) ? (raw.seed as number) : 1;
  let profile = createProfile(raw.name, seed);
  const delta = (raw.permanent as number) - profile.wallets.permanent;
  if (delta !== 0) {
    const adjusted = credit(profile, delta, 'migration', 'v0');
    if (!adjusted.ok) return null;
    profile = adjusted.value;
  }
  return { version: 2, revision: 0, writer: '', profile, duel: null, settings: defaultSettings(), lastResult: null, world: defaultWorld() };
};
