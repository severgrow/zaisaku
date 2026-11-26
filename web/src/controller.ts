import { chooseAction, BALANCED } from '../../src/bots/heuristic.js';
import { createDuel, expire, submit, validateAction } from '../../src/engine/duel.js';
import { viewFor } from '../../src/engine/view.js';
import {
  advanceMarket,
  bidInAuction,
  buyListing,
  cancelCurrentAuction,
  createProfile,
  inspectOwned,
  markNoticesSeen,
  note,
  openAuction,
  remember,
  rename,
  sellOwned,
  tickAuctionProfile,
  withdrawAuctionBid,
} from '../../src/economy/profile.js';
import { chooseSave, decodeSave, defaultSettings, encodeSave } from '../../src/persist/save.js';
import { locationById, poseFor } from '../../src/world/locations.js';
import { defaultWorld, markFlag, reconcileDisplays } from '../../src/world/state.js';
import type { ActorDef } from '../../src/world/types.js';
import type { TalkAction } from './session.js';
import type { DuelState } from '../../src/engine/types.js';
import { routeOf } from './session.js';
import type { Session } from './session.js';
import { bumpNavigation } from './world/intent.js';
import { tick } from './sound.js';

const KEY = 'zaisaku.save.v1';

const writer = (): string => {
  const existing = sessionStorage.getItem('zaisaku.writer');
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem('zaisaku.writer', next);
  return next;
};

const fresh = (): Session => ({
  profile: createProfile('Guest', crypto.getRandomValues(new Uint32Array(1))[0] || 1),
  duel: null,
  settings: defaultSettings(),
  lastResult: null,
  route: routeOf(location.hash),
  notice: null,
  selected: null,
  bid: 20,
  sort: 'value',
  clockMs: 20_000,
  world: defaultWorld(),
  revision: 0,
  panel: null,
  displaySlot: null,
  talk: null,
});

const boot = (): Session => {
  const raw = localStorage.getItem(KEY);
  const loaded = decodeSave(raw);
  if (raw && !loaded) {
    localStorage.setItem('zaisaku.save.corrupt', raw);
    const session = fresh();
    session.notice = 'The previous record could not be read. A new ledger is open. The old text was set aside on this device.';
    return session;
  }
  if (!loaded) return fresh();
  return {
    profile: note(loaded.profile, 'return'),
    duel: loaded.duel,
    settings: loaded.settings,
    lastResult: loaded.lastResult,
    route: routeOf(location.hash),
    notice: null,
    selected: null,
    bid: loaded.duel?.rules.minBid ?? 20,
    sort: 'value',
    clockMs: loaded.duel?.rules.decisionMs ?? 20_000,
    world: loaded.world,
    revision: loaded.revision,
    panel: null,
    displaySlot: null,
    talk: null,
  };
};

export const session: Session = boot();
let roundWatch = session.duel?.round ?? -1;
let render = (): void => {};
let op = 0;

export const setRenderer = (fn: () => void): void => {
  render = fn;
};

const notify = (): void => render();

const key = (name: string): string => `${name}-${Date.now()}-${op++}`;

const syncDisplays = (): void => {
  session.world = {
    ...session.world,
    displays: reconcileDisplays(
      session.world.displays,
      session.profile.inventory.map((item) => item.id),
    ),
  };
};

export const persist = (): void => {
  syncDisplays();
  const stored = decodeSave(localStorage.getItem(KEY));
  if (chooseSave(session.revision, stored) === 'adopt' && stored) {
    session.profile = stored.profile;
    session.duel = stored.duel;
    session.settings = stored.settings;
    session.lastResult = stored.lastResult;
    session.world = stored.world;
    session.revision = stored.revision;
    session.notice = 'Another tab saved a newer record. This tab kept it.';
    notify();
    return;
  }
  session.revision += 1;
  localStorage.setItem(
    KEY,
    encodeSave({
      version: 2,
      revision: session.revision,
      writer: writer(),
      profile: session.profile,
      duel: session.duel,
      settings: session.settings,
      lastResult: session.lastResult,
      world: session.world,
    }),
  );
};

export const setPose = (pose: { x: number; y: number; facing: Session['world']['facing']; locationId: string }): void => {
  session.world = { ...session.world, ...pose };
  if (!session.world.discovered.includes(pose.locationId)) {
    session.world = { ...session.world, discovered: [...session.world.discovered, pose.locationId] };
  }
};

export const travelTo = (locationId: string, spawn: string): void => {
  const pose = poseFor(locationId, spawn);
  session.world = {
    ...session.world,
    ...pose,
    discovered: session.world.discovered.includes(pose.locationId) ? session.world.discovered : [...session.world.discovered, pose.locationId],
  };
  session.panel = null;
  session.talk = null;
  bumpNavigation();
  persist();
  notify();
};

export const showTalk = (actor: ActorDef, actions: readonly TalkAction[]): void => {
  session.world = markFlag(session.world, `met:${actor.id}`);
  bumpNavigation();
  session.panel = 'talk';
  session.talk = { title: actor.name, line: actor.line, actorId: actor.id, actions: actions.map((item) => ({ ...item })) };
  session.notice = null;
  persist();
  notify();
};

export const performTalk = (actorId: string, opens: string): void => {
  if (!opens) return;
  const actor = locationById(session.world.locationId).actors.find((item) => item.id === actorId);
  if (!actor) {
    closePanel();
    return;
  }
  openWorldThing(actor);
};

export const openWorldThing = (actor: ActorDef): void => {
  session.world = markFlag(session.world, `met:${actor.id}`);
  session.talk = null;
  bumpNavigation();
  if (actor.kind === 'terminal') {
    persist();
    location.hash = '#/';
    return;
  }
  if (actor.kind === 'display') {
    session.displaySlot = actor.slot;
    session.panel = 'display';
    session.notice = actor.line;
    persist();
    notify();
    return;
  }
  if (actor.kind === 'flora' || actor.kind === 'resonance' || actor.kind === 'rest') {
    session.panel = 'talk';
    session.talk = { title: actor.name, line: actor.line, actorId: actor.id, actions: [] };
    session.notice = null;
    persist();
    notify();
    return;
  }
  if (actor.kind === 'duel') {
    session.panel = 'duel';
    session.notice = actor.line;
    persist();
    notify();
    return;
  }
  session.panel = actor.kind;
  session.notice = actor.line;
  persist();
  notify();
};

export const closePanel = (): void => {
  session.panel = null;
  session.talk = null;
  bumpNavigation();
  notify();
};

export const placeDisplay = (slot: string, instanceId: string | null): void => {
  if (instanceId && !session.profile.inventory.some((item) => item.id === instanceId)) {
    session.notice = 'That object is not in the vault.';
    notify();
    return;
  }
  const displays = { ...session.world.displays, [slot]: instanceId };
  for (const [other, id] of Object.entries(displays)) {
    if (other !== slot && id && id === instanceId) displays[other] = null;
  }
  session.world = { ...session.world, displays };
  session.notice = instanceId ? 'It is on the shelf.' : 'The shelf is clear.';
  persist();
  notify();
};

const commitDuel = (next: DuelState): void => {
  session.duel = next;
  session.selected = null;
  if (next.result) {
    session.lastResult = next.result;
    const started = session.profile.analytics.counts.duel_started_at ?? Date.now();
    session.profile = remember(session.profile, 'duel_duration', Math.max(1, Math.round((Date.now() - started) / 1000)));
  }
  session.notice = next.log.at(-1) ?? null;
  session.clockMs = next.rules.decisionMs;
  roundWatch = next.round;
  persist();
  tick(session.settings.sound);
  notify();
};

const withBot = (next: DuelState): void => {
  if (next.phase === 'decide' && next.decisions.p0 && !next.decisions.p1) {
    const choice = chooseAction(viewFor(next, 'p1'), BALANCED);
    const invalid = validateAction(next, 'p1', choice);
    const bot = submit(next, 'p1', invalid ? { type: 'pass' } : choice);
    if (bot.ok) {
      commitDuel(bot.value);
      return;
    }
  }
  commitDuel(next);
};

export const beginDuel = (): void => {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  const again = (session.profile.analytics.counts.first_duel ?? 0) > 0 || session.lastResult !== null;
  session.profile = note(session.profile, again ? 'rematch' : 'first_duel');
  session.profile = remember(session.profile, 'duel_started_at', Date.now());
  session.duel = createDuel(seed, { names: [session.profile.name, 'Clerk Vesper'], simulated: [false, true] });
  session.clockMs = session.duel.rules.decisionMs;
  session.route = 'duel';
  session.panel = null;
  session.notice = 'Clerk Vesper sits opposite. A simulated opponent, not a live player.';
  session.selected = null;
  roundWatch = session.duel.round;
  location.hash = '#/duel';
  persist();
  notify();
};

export const played = (result: ReturnType<typeof submit>): void => {
  if (!result.ok) {
    session.notice = result.reason;
    notify();
    return;
  }
  withBot(result.value);
};

export const applyProfile = (ok: boolean, reason: string, next: Session['profile'] | null, success: string): void => {
  session.notice = ok ? success : reason;
  if (ok && next) session.profile = next;
  syncDisplays();
  persist();
  notify();
};

export const buy = (id: string): void => {
  const bought = buyListing(session.profile, id, key(`buy-${id}`));
  applyProfile(bought.ok, bought.ok ? '' : bought.reason, bought.ok ? bought.value : null, 'Bought. It is in the vault.');
};

export const sellVault = (id: string): void => {
  const sold = sellOwned(session.profile, id, key(`sell-${id}`));
  applyProfile(sold.ok, sold.ok ? '' : sold.reason, sold.ok ? sold.value : null, 'Sold to the house.');
};

export const inspectVault = (id: string): void => {
  const looked = inspectOwned(session.profile, id);
  applyProfile(looked.ok, looked.ok ? '' : looked.reason, looked.ok ? looked.value : null, 'A note is now on the card.');
};

export const reduced = (): boolean =>
  session.settings.reducedMotion === 'reduce' ||
  (session.settings.reducedMotion === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const duelClock = (): void => {
  const duel = session.duel;
  if (!duel || duel.phase !== 'decide' || duel.decisions.p0) return;
  if (roundWatch !== duel.round) {
    roundWatch = duel.round;
    session.clockMs = duel.rules.decisionMs;
  }
  session.clockMs = Math.max(0, session.clockMs - 250);
  const node = document.querySelector('[data-timer]');
  if (node) node.textContent = formatClock(session.clockMs);
  if (session.clockMs <= 0 && !duel.decisions.p0) {
    session.clockMs = duel.rules.decisionMs;
    const step = expire(duel, 'p0');
    if (step.ok) withBot(step.value);
  }
};

const formatClock = (ms: number): string => {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
};

const auctionClock = (): void => {
  const auction = session.profile.auction;
  if (!auction || auction.status !== 'open') return;
  const before = `${auction.status}:${auction.bids.length}`;
  session.profile = tickAuctionProfile(session.profile);
  const now = session.profile.auction;
  persist();
  const after = now ? `${now.status}:${now.bids.length}` : '';
  if (before !== after) notify();
  else {
    const node = document.querySelector('[data-auction-clock]');
    if (node && now) node.textContent = `${now.remainingTicks}s on the clock`;
  }
};

let started = false;
export const start = (): void => {
  if (session.route === 'market') session.profile = markNoticesSeen(session.profile);
  persist();
  notify();
  if (started) return;
  started = true;
  window.setInterval(duelClock, 250);
  window.setInterval(auctionClock, 1000);
  window.addEventListener('hashchange', () => {
    session.route = routeOf(location.hash);
    session.panel = null;
    session.talk = null;
    bumpNavigation();
    if (session.route === 'market') session.profile = markNoticesSeen(session.profile);
    persist();
    notify();
  });
};

export const abandonDuel = (): void => {
  session.duel = null;
  session.notice = 'The match is set aside. Your vault was not touched.';
  persist();
  notify();
};

export const renameCollector = (name: string): void => {
  session.profile = rename(session.profile, name);
  session.notice = `The house will call you ${session.profile.name}.`;
  persist();
  notify();
};

export const advance = (): void => {
  session.profile = advanceMarket(session.profile);
  session.notice = session.profile.notifications[0]?.text ?? 'The wire moves.';
  persist();
  notify();
};

export const openLot = (): void => {
  const opened = openAuction(session.profile, key('auc'));
  applyProfile(opened.ok, opened.ok ? '' : opened.reason, opened.ok ? opened.value : null, 'A lot is on the block. House bidders are simulated.');
};

export const placeBid = (amount: number): void => {
  const bid = bidInAuction(session.profile, amount, key(`bid-${amount}`));
  applyProfile(bid.ok, bid.ok ? '' : bid.reason, bid.ok ? bid.value : null, 'Bid sealed into escrow.');
};

export const pullBid = (): void => {
  const pulled = withdrawAuctionBid(session.profile);
  applyProfile(pulled.ok, pulled.ok ? '' : pulled.reason, pulled.ok ? pulled.value : null, 'Your bid is withdrawn and the reserve is released.');
};

export const cancelLot = (): void => {
  const cancelled = cancelCurrentAuction(session.profile);
  applyProfile(cancelled.ok, cancelled.ok ? '' : cancelled.reason, cancelled.ok ? cancelled.value : null, 'The lot is withdrawn. Nothing was charged.');
};

