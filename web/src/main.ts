import { chooseAction, BALANCED } from '../../src/bots/heuristic.js';
import { snapBid } from '../../src/engine/bids.js';
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
import { decodeSave, defaultSettings, encodeSave } from '../../src/persist/save.js';
import type { DuelState } from '../../src/engine/types.js';
import { routeOf } from './session.js';
import type { Session } from './session.js';
import { tick } from './sound.js';
import { clock, esc } from './ui/text.js';
import { shell } from './ui/shell.js';
import { homeScreen, settingsScreen } from './view/home.js';
import { duelScreen, resultsScreen } from './view/duel.js';
import { contractsScreen, marketScreen, vaultScreen } from './view/market.js';
import { auctionScreen } from './view/auction.js';

const KEY = 'zaisaku.save.v1';

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
  };
};

const session = boot();
let roundWatch = session.duel?.round ?? -1;

const persist = (): void => {
  localStorage.setItem(
    KEY,
    encodeSave({
      version: 1,
      profile: session.profile,
      duel: session.duel,
      settings: session.settings,
      lastResult: session.lastResult,
    }),
  );
};

const paintPrefs = (): void => {
  const reduce =
    session.settings.reducedMotion === 'reduce' ||
    (session.settings.reducedMotion === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.classList.toggle('reduce', reduce);
  document.documentElement.classList.toggle('large-text', session.settings.largeText);
};

const screen = (): string => {
  switch (session.route) {
    case 'duel':
      return duelScreen(session);
    case 'market':
      return marketScreen(session);
    case 'auction':
      return auctionScreen(session);
    case 'vault':
      return vaultScreen(session);
    case 'contracts':
      return contractsScreen(session);
    case 'results':
      return resultsScreen(session);
    case 'settings':
      return settingsScreen(session);
    default:
      return homeScreen(session);
  }
};

const render = (): void => {
  const app = document.querySelector('#app');
  if (!app) return;
  const noteHtml = session.notice ? `<p class="notice" role="status">${esc(session.notice)}</p>` : '';
  app.innerHTML = shell(session, noteHtml + screen());
  paintPrefs();
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
  render();
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

const beginDuel = (): void => {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  const again = (session.profile.analytics.counts.first_duel ?? 0) > 0 || session.lastResult !== null;
  session.profile = note(session.profile, again ? 'rematch' : 'first_duel');
  session.profile = remember(session.profile, 'duel_started_at', Date.now());
  session.duel = createDuel(seed, { names: [session.profile.name, 'Clerk Vesper'], simulated: [false, true] });
  session.clockMs = session.duel.rules.decisionMs;
  session.route = 'duel';
  session.notice = 'Clerk Vesper sits opposite. A simulated opponent, not a live player.';
  session.selected = null;
  roundWatch = session.duel.round;
  location.hash = '#/duel';
  persist();
  render();
};

let op = 0;
const key = (name: string): string => `${name}-${Date.now()}-${op++}`;

const played = (result: ReturnType<typeof submit>): void => {
  if (!result.ok) {
    session.notice = result.reason;
    render();
    return;
  }
  withBot(result.value);
};

const onClick = (event: MouseEvent): void => {
  const node = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-act]');
  if (!node) return;
  const act = node.dataset.act ?? '';
  const id = node.dataset.id ?? session.selected;
  const duel = session.duel;

  if (act === 'begin-duel') beginDuel();
  else if (act === 'abandon') {
    session.duel = null;
    session.notice = 'The match is set aside. Your vault was not touched.';
    persist();
    render();
  } else if (act === 'select' && id) {
    session.selected = id;
    if (duel) {
      const view = viewFor(duel, 'p0');
      const offer = view.offers.find((item) => item.instanceId === id);
      if (offer) {
        const aimed = snapBid(Math.floor(offer.quote.liquidation * 0.85), view.minBid, view.increment);
        const cap = snapBid(view.cash, view.minBid, view.increment);
        session.bid = aimed > 0 && cap > 0 ? Math.min(aimed, cap) : view.minBid;
      }
    }
    render();
  } else if (act === 'bid-inc' && duel) {
    const view = viewFor(duel, 'p0');
    if (session.bid + view.increment <= view.cash) session.bid += view.increment;
    render();
  } else if (act === 'bid-dec' && duel) {
    const view = viewFor(duel, 'p0');
    if (session.bid - view.increment >= view.minBid) session.bid -= view.increment;
    render();
  }   else if (act === 'lock-bid' && duel && session.selected) played(submit(duel, 'p0', { type: 'bid', instanceId: session.selected, amount: session.bid }));
  else if (act === 'sell' && duel && session.selected) played(submit(duel, 'p0', { type: 'sell', instanceId: session.selected }));
  else if (act === 'inspect' && duel && session.selected) played(submit(duel, 'p0', { type: 'inspect', instanceId: session.selected }));
  else if (act === 'pass' && duel) played(submit(duel, 'p0', { type: 'pass' }));
  else if (act === 'buy' && id) {
    const bought = buyListing(session.profile, id, key(`buy-${id}`));
    session.notice = bought.ok ? 'Bought. It is in the vault.' : bought.reason;
    if (bought.ok) session.profile = bought.value;
    persist();
    render();
  } else if (act === 'advance') {
    session.profile = advanceMarket(session.profile);
    session.notice = session.profile.notifications[0]?.text ?? 'The wire moves.';
    persist();
    render();
  } else if (act === 'sell-vault' && id) {
    const sold = sellOwned(session.profile, id, key(`sell-${id}`));
    session.notice = sold.ok ? 'Sold to the house.' : sold.reason;
    if (sold.ok) session.profile = sold.value;
    persist();
    render();
  } else if (act === 'inspect-vault' && id) {
    const looked = inspectOwned(session.profile, id);
    session.notice = looked.ok ? 'A note is now on the card.' : looked.reason;
    if (looked.ok) session.profile = looked.value;
    persist();
    render();
  } else if (act === 'sort') {
    const sort = node.dataset.sort;
    if (sort === 'value' || sort === 'name' || sort === 'category' || sort === 'acquired') session.sort = sort;
    render();
  } else if (act === 'open-auction') {
    const opened = openAuction(session.profile, key('auc'));
    session.notice = opened.ok ? 'A lot is on the block. House bidders are simulated.' : opened.reason;
    if (opened.ok) session.profile = opened.value;
    persist();
    render();
  } else if (act === 'auction-bid') {
    const amount = Number(node.dataset.amount);
    const bid = bidInAuction(session.profile, amount, key(`bid-${amount}`));
    session.notice = bid.ok ? 'Bid sealed into escrow.' : bid.reason;
    if (bid.ok) session.profile = bid.value;
    persist();
    render();
  } else if (act === 'withdraw-bid') {
    const pulled = withdrawAuctionBid(session.profile);
    session.notice = pulled.ok ? 'Your bid is withdrawn and the reserve is released.' : pulled.reason;
    if (pulled.ok) session.profile = pulled.value;
    persist();
    render();
  } else if (act === 'cancel-auction') {
    const cancelled = cancelCurrentAuction(session.profile);
    session.notice = cancelled.ok ? 'The lot is withdrawn. Nothing was charged.' : cancelled.reason;
    if (cancelled.ok) session.profile = cancelled.value;
    persist();
    render();
  } else if (act === 'motion') {
    const value = node.dataset.value;
    if (value === 'system' || value === 'reduce' || value === 'allow') session.settings = { ...session.settings, reducedMotion: value };
    persist();
    render();
  } else if (act === 'sound') {
    session.settings = { ...session.settings, sound: !session.settings.sound };
    persist();
    tick(session.settings.sound);
    render();
  } else if (act === 'type') {
    session.settings = { ...session.settings, largeText: !session.settings.largeText };
    persist();
    render();
  }
};

document.addEventListener('click', onClick);
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.dataset.act !== 'rename') return;
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('collector') ?? '');
  session.profile = rename(session.profile, name);
  session.notice = `The house will call you ${session.profile.name}.`;
  persist();
  render();
});

window.addEventListener('hashchange', () => {
  session.route = routeOf(location.hash);
  if (session.route === 'market') session.profile = markNoticesSeen(session.profile);
  persist();
  render();
});

window.setInterval(() => {
  const duel = session.duel;
  if (!duel || duel.phase !== 'decide' || duel.decisions.p0) return;
  if (roundWatch !== duel.round) {
    roundWatch = duel.round;
    session.clockMs = duel.rules.decisionMs;
  }
  session.clockMs = Math.max(0, session.clockMs - 250);
  const node = document.querySelector('[data-timer]');
  if (node) node.textContent = clock(session.clockMs);
  if (session.clockMs <= 0 && !duel.decisions.p0) {
    session.clockMs = duel.rules.decisionMs;
    const step = expire(duel, 'p0');
    if (step.ok) withBot(step.value);
  }
}, 250);

window.setInterval(() => {
  const auction = session.profile.auction;
  if (!auction || auction.status !== 'open') return;
  const before = `${auction.status}:${auction.bids.length}`;
  session.profile = tickAuctionProfile(session.profile);
  const now = session.profile.auction;
  persist();
  const after = now ? `${now.status}:${now.bids.length}` : '';
  if (before !== after) render();
  else {
    const node = document.querySelector('[data-auction-clock]');
    if (node && now) node.textContent = `${now.remainingTicks}s on the clock`;
  }
}, 1000);

if (session.route === 'market') session.profile = markNoticesSeen(session.profile);
persist();
render();
