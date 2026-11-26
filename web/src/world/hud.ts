import { esc, zai } from '../ui/text.js';
import { mineralUrl } from './mineral.js';
import type { Session, TalkFocus } from '../session.js';
import { auctionScreen } from '../view/auction.js';
import { contractsScreen, marketScreen, vaultScreen } from '../view/market.js';
import { symbol } from '../ui/symbols.js';
import { definition } from '../../../src/engine/definitions.js';

export const worldHud = (session: Session): string => {
  const free = session.profile.wallets.permanent - session.profile.wallets.reserved;
  return `
    <div class="hud">
      <div class="hud-bar hud-hit">
        <p class="funds num">${zai(free)} <span class="muted">Zai</span></p>
        <a href="#/">${symbol('exchange')} Terminal</a>
        <button type="button" data-act="world-vault">${symbol('storage')} Vault</button>
      </div>
      <p class="prompt" data-prompt></p>
      <div class="joy hud-hit" data-joy aria-label="Move"><span></span></div>
      <button class="use hud-hit" type="button" data-act="world-interact">Use</button>
      ${panel(session)}
    </div>
  `;
};

const portraitUrl = (id: string): string | null =>
  id === 'ivo' || id === 'ness' || id === 'archivist' ? mineralUrl(`instrument/portrait-${id}.png`) : null;

const talkHead = (focus: TalkFocus): string => {
  const src = portraitUrl(focus.id);
  return `
    <div class="talk">
      ${src ? `<img class="bust" alt="" src="${esc(src)}" width="96" height="96" />` : ''}
      <div>
        <h2>${esc(focus.name)}</h2>
        <p>${esc(focus.line)}</p>
      </div>
    </div>
  `;
};

const panel = (session: Session): string => {
  if (!session.panel) return '';
  const leave = session.focus ? 'Leave' : 'Close';
  const close = `<button class="btn quiet" type="button" data-act="close-panel">${leave}</button>`;
  const note = session.notice && !session.focus ? `<p class="notice" role="status">${esc(session.notice)}</p>` : '';
  const who = session.focus ? talkHead(session.focus) : '';
  let body = '';
  if (session.panel === 'merchant') body = marketScreen(session);
  else if (session.panel === 'auction') body = auctionScreen(session);
  else if (session.panel === 'contract') body = contractsScreen(session);
  else if (session.panel === 'storage') body = vaultScreen(session);
  else if (session.panel === 'research') body = research(session);
  else if (session.panel === 'display') body = display(session);
  else if (session.panel === 'duel') body = `<p>A sealed match against Clerk Vesper. The clerk is simulated.</p><button class="btn primary" type="button" data-act="begin-duel">Sit the duel</button>`;
  else body = `<p>${esc(session.notice ?? '')}</p>`;
  const inner = session.focus ? `${who}${close}${body}` : `${close}${note}${body}`;
  return `<section class="world-panel hud-hit" role="dialog" aria-label="Interaction">${inner}</section>`;
};

const research = (session: Session): string => {
  const items = session.profile.inventory;
  if (!items.length) return `<p>The vault is empty. The bench has nothing to read.</p>`;
  return `<ul class="stack">${items
    .map((item) => {
      const def = definition(item.definitionId);
      return `<li class="panel"><strong>${esc(def.name)}</strong><button class="btn" type="button" data-act="inspect-vault" data-id="${esc(item.id)}">Read papers</button></li>`;
    })
    .join('')}</ul>`;
};

const display = (session: Session): string => {
  const slot = session.displaySlot;
  if (!slot) return `<p>This shelf has no slot.</p>`;
  const current = session.world.displays[slot];
  const options = session.profile.inventory
    .map((item) => {
      const def = definition(item.definitionId);
      const on = current === item.id ? 'primary' : '';
      return `<button class="btn ${on}" type="button" data-act="place" data-slot="${esc(slot)}" data-id="${esc(item.id)}">${esc(def.name)}</button>`;
    })
    .join('');
  return `
    <p>Only an object you own can sit here. Selling it clears the shelf.</p>
    <div class="row">${options || '<p>The vault is empty.</p>'}</div>
    <button class="btn quiet" type="button" data-act="clear-display" data-slot="${esc(slot)}">Clear shelf</button>
  `;
};
