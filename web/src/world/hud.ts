import { esc, zai } from '../ui/text.js';
import { icon } from '../ui/icon.js';
import type { Session } from '../session.js';
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
      <p class="prompt" data-prompt></p>
      <div class="joy hud-hit" data-joy aria-label="Move"><span></span></div>
      <button class="use za-hud-control hud-hit" type="button" data-act="world-interact">${icon('interact')}<span>Use</span></button>
      ${panel(session)}
    </div>
  `;
};

const panel = (session: Session): string => {
  if (!session.panel) return '';
  const close = `<header class="panel-bar"><button class="btn za-btn" data-kind="quiet" type="button" data-act="close-panel">${icon('close')}<span>Close</span></button></header>`;
  const note = session.notice ? `<p class="notice za-notice" role="status">${esc(session.notice)}</p>` : '';
  let body = '';
  if (session.panel === 'merchant') body = marketScreen(session);
  else if (session.panel === 'auction') body = auctionScreen(session);
  else if (session.panel === 'contract') body = contractsScreen(session);
  else if (session.panel === 'storage') body = vaultScreen(session);
  else if (session.panel === 'research') body = research(session);
  else if (session.panel === 'display') body = display(session);
  else if (session.panel === 'duel') body = `<p>A sealed match against Clerk Vesper. The clerk is simulated.</p><button class="btn za-btn" data-kind="primary" type="button" data-act="begin-duel">Sit the duel</button>`;
  else body = `<p>${esc(session.notice ?? '')}</p>`;
  return `<section class="world-panel hud-hit" role="dialog" aria-label="Interaction">${close}${note}${body}</section>`;
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
