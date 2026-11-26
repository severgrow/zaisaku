import { snapBid } from '../../src/engine/bids.js';
import { submit } from '../../src/engine/duel.js';
import { viewFor } from '../../src/engine/view.js';
import { esc } from './ui/text.js';
import { shell } from './ui/shell.js';
import { homeScreen, settingsScreen } from './view/home.js';
import { duelScreen, resultsScreen } from './view/duel.js';
import { contractsScreen, marketScreen, vaultScreen } from './view/market.js';
import { auctionScreen } from './view/auction.js';
import { intent } from './world/intent.js';
import { enterWorld, leaveWorld, onVisibility } from './world/gate.js';
import { worldHud } from './world/hud.js';
import { mountWorkshop, workshopScreen } from './world/workshop.js';
import {
  abandonDuel,
  advance,
  beginDuel,
  buy,
  cancelLot,
  closePanel,
  inspectVault,
  openLot,
  persist,
  placeBid,
  placeDisplay,
  played,
  pullBid,
  renameCollector,
  sellVault,
  session,
  setRenderer,
  start,
} from './controller.js';
import { tick } from './sound.js';

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
    case 'workshop':
      return workshopScreen();
    case 'world':
      return worldHud(session);
    default:
      return homeScreen(session);
  }
};

const render = (): void => {
  const app = document.querySelector('#app');
  const host = document.querySelector('#world-host');
  if (!app) return;
  paintPrefs();
  if (session.route === 'world') {
    app.classList.add('world-mode');
    if (host instanceof HTMLElement) host.hidden = false;
    app.innerHTML = screen();
    void enterWorld();
    return;
  }
  app.classList.remove('world-mode');
  if (host instanceof HTMLElement) host.hidden = true;
  leaveWorld();
  const noteHtml = session.notice ? `<p class="notice" role="status">${esc(session.notice)}</p>` : '';
  app.innerHTML = shell(session, noteHtml + screen());
  if (session.route === 'workshop') mountWorkshop();
};

setRenderer(render);

const onClick = (event: MouseEvent): void => {
  const node = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-act]');
  if (!node) return;
  const act = node.dataset.act ?? '';
  const id = node.dataset.id ?? session.selected;
  const duel = session.duel;

  if (act === 'world-interact') {
    intent.interact = true;
    return;
  }
  if (act === 'close-panel') closePanel();
  else if (act === 'world-vault') {
    session.panel = 'storage';
    session.speaker = null;
    session.notice = 'The same vault as the terminal.';
    render();
  } else if (act === 'place' && node.dataset.slot && node.dataset.id) placeDisplay(node.dataset.slot, node.dataset.id);
  else if (act === 'clear-display' && node.dataset.slot) placeDisplay(node.dataset.slot, null);
  else if (act === 'begin-duel') beginDuel();
  else if (act === 'abandon') abandonDuel();
  else if (act === 'select' && id) {
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
  } else if (act === 'lock-bid' && duel && session.selected) played(submit(duel, 'p0', { type: 'bid', instanceId: session.selected, amount: session.bid }));
  else if (act === 'sell' && duel && session.selected) played(submit(duel, 'p0', { type: 'sell', instanceId: session.selected }));
  else if (act === 'inspect' && duel && session.selected) played(submit(duel, 'p0', { type: 'inspect', instanceId: session.selected }));
  else if (act === 'pass' && duel) played(submit(duel, 'p0', { type: 'pass' }));
  else if (act === 'buy' && id) buy(id);
  else if (act === 'advance') advance();
  else if (act === 'sell-vault' && id) sellVault(id);
  else if (act === 'inspect-vault' && id) inspectVault(id);
  else if (act === 'sort') {
    const sort = node.dataset.sort;
    if (sort === 'value' || sort === 'name' || sort === 'category' || sort === 'acquired') session.sort = sort;
    render();
  } else if (act === 'open-auction') openLot();
  else if (act === 'auction-bid') placeBid(Number(node.dataset.amount));
  else if (act === 'withdraw-bid') pullBid();
  else if (act === 'cancel-auction') cancelLot();
  else if (act === 'motion') {
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

let joyId: number | null = null;
const joyAt = (event: PointerEvent): void => {
  const joy = document.querySelector('[data-joy]');
  if (!(joy instanceof HTMLElement) || joyId !== event.pointerId) return;
  const rect = joy.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, len / (rect.width / 3));
  intent.x = (dx / len) * scale;
  intent.y = (dy / len) * scale;
  const knob = joy.querySelector('span');
  if (knob instanceof HTMLElement) {
    knob.style.transform = `translate(${(dx / len) * scale * 28}px, ${(dy / len) * scale * 28}px)`;
  }
};

document.addEventListener('click', onClick);
document.addEventListener('pointerdown', (event) => {
  const joy = (event.target as HTMLElement | null)?.closest('[data-joy]');
  if (!joy) return;
  joyId = event.pointerId;
  joyAt(event);
});
document.addEventListener('pointermove', joyAt);
document.addEventListener('pointerup', (event) => {
  if (joyId !== event.pointerId) return;
  joyId = null;
  intent.x = 0;
  intent.y = 0;
  const knob = document.querySelector('[data-joy] span');
  if (knob instanceof HTMLElement) knob.style.transform = '';
});
document.addEventListener('pointercancel', () => {
  joyId = null;
  intent.x = 0;
  intent.y = 0;
});
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.dataset.act !== 'rename') return;
  event.preventDefault();
  const data = new FormData(form);
  renameCollector(String(data.get('collector') ?? ''));
});
document.addEventListener('visibilitychange', () => {
  onVisibility(document.hidden, session.route === 'world');
});

start();
