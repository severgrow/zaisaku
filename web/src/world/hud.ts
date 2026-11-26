import { esc, zai } from '../ui/text.js';
import type { Session } from '../session.js';
import { auctionScreen } from '../view/auction.js';
import { contractsScreen, marketScreen, vaultScreen } from '../view/market.js';
import { symbol } from '../ui/symbols.js';
import { definition } from '../../../src/engine/definitions.js';
import { locationById } from '../../../src/world/locations.js';
import { PORTRAITS } from './mineral.js';

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

const speakerOf = (session: Session) => {
  if (!session.speaker) return null;
  const file = PORTRAITS[session.speaker];
  if (!file) return null;
  const actor = locationById(session.world.locationId).actors.find((item) => item.id === session.speaker);
  if (!actor) return null;
  return { actor, file };
};

const panel = (session: Session): string => {
  if (!session.panel) return '';
  const speaker = speakerOf(session);
  const talk = speaker
    ? `<div class="talk"><img src="mineral/${speaker.file}" alt="" width="128" height="128"><div><h2>${esc(speaker.actor.name)}</h2><p>${esc(speaker.actor.line)}</p></div></div>`
    : '';
  const close = `<button class="btn quiet" type="button" data-act="close-panel">${talk ? 'Leave' : 'Close'}</button>`;
  const note = session.notice && session.notice !== speaker?.actor.line ? `<p class="notice" role="status">${esc(session.notice)}</p>` : '';
  let body = '';
  if (session.panel === 'merchant') body = marketScreen(session);
  else if (session.panel === 'auction') body = auctionScreen(session);
  else if (session.panel === 'contract') body = contractsScreen(session);
  else if (session.panel === 'storage') body = vaultScreen(session);
  else if (session.panel === 'research') body = research(session);
  else if (session.panel === 'display') body = display(session);
  else if (session.panel === 'duel') body = `<p>A sealed match against Clerk Vesper. The clerk is simulated.</p><button class="btn primary" type="button" data-act="begin-duel">Sit the duel</button>`;
  else body = `<p>${esc(session.notice ?? '')}</p>`;
  return `<section class="world-panel hud-hit" role="dialog" aria-label="Interaction">${talk}${close}${note}${body}</section>`;
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
