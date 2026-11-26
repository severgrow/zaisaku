import { esc, zai } from '../ui/text.js';
import { mineralUrl } from './mineral.js';
import { icon } from '../ui/icon.js';
import type { Session, TalkFocus } from '../session.js';
import { auctionScreen } from '../view/auction.js';
import { contractsScreen, marketScreen, vaultScreen } from '../view/market.js';
import { definition } from '../../../src/engine/definitions.js';

export const worldHud = (session: Session): string => {
  const free = session.profile.wallets.permanent - session.profile.wallets.reserved;
  return `
    <div class="hud">
      <div class="hud-bar hud-hit">
        <p class="funds za-balance num">${zai(free)} <span>Zai</span></p>
        <a class="za-btn" data-kind="quiet" href="#/">${icon('home')}<span>Terminal</span></a>
        <button class="za-btn" data-kind="quiet" type="button" data-act="world-vault">${icon('vault')}<span>Vault</span></button>
      </div>
      <p class="prompt" data-prompt aria-live="polite"></p>
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

const talkCard = (session: Session): string => {
  const talk = session.talk;
  if (!talk) return '';
  const portrait = portraitUrl(talk.actorId);
  const actions = talk.actions
    .map(
      (action) =>
        `<button class="btn za-btn" data-kind="${action.opens ? 'primary' : 'quiet'}" type="button" data-act="talk-go" data-actor="${esc(talk.actorId)}" data-opens="${esc(action.opens ?? '')}">${esc(action.label)}</button>`,
    )
    .join('');
  return `
    <section class="world-panel talk hud-hit" role="dialog" aria-label="${esc(talk.title)}">
      <div class="talk">
        ${portrait ? `<img class="bust" alt="" src="${esc(portrait)}" width="96" height="96" />` : ''}
        <div>
          <h2>${esc(talk.title)}</h2>
          <p>${esc(talk.line)}</p>
        </div>
      </div>
      <div class="row">${actions}<button class="btn za-btn" data-kind="quiet" type="button" data-act="close-panel">Leave</button></div>
    </section>
  `;
};

const panel = (session: Session): string => {
  if (session.panel === 'talk') return talkCard(session);
  if (!session.panel) return '';
  const leave = session.focus ? 'Leave' : 'Close';
  const close = `<header class="panel-bar"><button class="btn za-btn" data-kind="quiet" type="button" data-act="close-panel">${icon('close')}<span>${leave}</span></button></header>`;
  const note = session.notice && !session.focus ? `<p class="notice za-notice" role="status">${esc(session.notice)}</p>` : '';
  const who = session.focus ? talkHead(session.focus) : '';
  let body = '';
  if (session.panel === 'merchant') body = marketScreen(session);
  else if (session.panel === 'auction') body = auctionScreen(session);
  else if (session.panel === 'contract') body = contractsScreen(session);
  else if (session.panel === 'storage') body = vaultScreen(session);
  else if (session.panel === 'research') body = research(session);
  else if (session.panel === 'display') body = display(session);
  else if (session.panel === 'duel') body = `<p>A sealed match against Clerk Vesper. The clerk is simulated.</p><button class="btn za-btn" data-kind="primary" type="button" data-act="begin-duel">Sit the duel</button>`;
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
      return `<li><strong>${esc(def.name)}</strong><button class="btn za-btn" type="button" data-act="inspect-vault" data-id="${esc(item.id)}">${icon('inspect')}<span>Read papers</span></button></li>`;
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
      const on = current === item.id;
      return `<button class="btn za-btn" type="button" aria-pressed="${on ? 'true' : 'false'}" data-act="place" data-slot="${esc(slot)}" data-id="${esc(item.id)}">${esc(def.name)}</button>`;
    })
    .join('');
  return `
    <p>Only an object you own can sit here. Selling it clears the shelf.</p>
    <div class="row">${options || '<p>The vault is empty.</p>'}</div>
    <button class="btn za-btn" data-kind="danger" type="button" data-act="clear-display" data-slot="${esc(slot)}">Clear shelf</button>
  `;
};
