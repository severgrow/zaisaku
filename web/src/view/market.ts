import { definition } from '../../../src/engine/definitions.js';
import { activeAtTick } from '../../../src/engine/events.js';
import { appraise } from '../../../src/engine/valuation.js';
import { marketContext } from '../../../src/economy/profile.js';
import { plate } from '../ui/art.js';
import { icon } from '../ui/icon.js';
import { esc, signed, zai } from '../ui/text.js';
import type { Session } from '../session.js';

export const marketScreen = (session: Session): string => {
  const profile = session.profile;
  const ctx = marketContext(profile);
  const event = activeAtTick(profile.seed, profile.tick)[0];
  const cards = profile.listings
    .map((item) => {
      const def = definition(item.definitionId);
      const quote = appraise(def, item, ctx);
      return `<article class="lot">
        ${plate(def.artworkRef, def.category)}
        <div>
          <h3>${esc(def.name)}</h3>
          <p class="meta">${esc(def.manufacturer)} · ${esc(def.category)} · ${esc(item.condition >= 70 ? 'sound enough' : 'marked')}</p>
          <p class="meta">${esc(def.description)}</p>
          <p class="price">Buy <b class="num">${zai(quote.ask)}</b> <span class="muted">· would sell ${zai(quote.liquidation)}</span></p>
          <button class="btn za-btn" data-kind="primary" data-act="buy" data-id="${esc(item.id)}">Buy for ${zai(quote.ask)}</button>
        </div>
      </article>`;
    })
    .join('');
  return `
    <p class="kicker">Market · tick ${profile.tick}</p>
    <h1>The board</h1>
    <p class="lede">The house sells at the ask and buys at the lower liquidation. Flipping a lot before the wire moves loses money.</p>
    ${event ? `<p class="notice za-notice">${esc(event.name)}. ${esc(event.summary)}</p>` : '<p class="meta">No event on the wire.</p>'}
    <div class="row" style="margin-bottom:12px">
      <button class="btn za-btn" data-act="advance">Next transmission</button>
      <span class="num muted">${zai(profile.wallets.permanent - profile.wallets.reserved)} free</span>
    </div>
    <div class="stack">${cards || '<p>The board is empty until the next transmission.</p>'}</div>
  `;
};

export const vaultScreen = (session: Session): string => {
  const profile = session.profile;
  const ctx = marketContext(profile);
  const items = [...profile.inventory].sort((a, b) => {
    const da = definition(a.definitionId);
    const db = definition(b.definitionId);
    if (session.sort === 'name') return da.name.localeCompare(db.name);
    if (session.sort === 'category') return da.category.localeCompare(db.category) || da.name.localeCompare(db.name);
    if (session.sort === 'acquired') return b.acquiredAt - a.acquiredAt;
    return appraise(db, b, ctx).liquidation - appraise(da, a, ctx).liquidation;
  });
  const cards = items
    .map((item) => {
      const def = definition(item.definitionId);
      const quote = appraise(def, item, { ...ctx, narrowed: item.revealedProps.length > 0 });
      const delta = quote.liquidation - item.acquisitionPrice;
      const notes = def.inspectionProps
        .filter((prop) => !prop.hidden || item.revealedProps.includes(prop.key))
        .map((prop) => {
          const value = prop.key === 'authenticity' ? item.authenticity : prop.key === 'condition-exact' ? String(item.condition) : prop.value;
          return `<li>${esc(prop.label)}: ${esc(value)}</li>`;
        })
        .join('');
      return `<article class="panel">
        <div class="lot" style="border:0;padding:0;background:transparent">
          ${plate(def.artworkRef, def.category)}
          <div>
            <h3>${esc(def.name)}</h3>
            <p class="meta">${esc(def.manufacturer)} · ${esc(def.category)} · ${esc(item.revealedProps.includes('authenticity') ? item.authenticity : 'papers unread')}</p>
            <p class="price">Paid <b class="num">${zai(item.acquisitionPrice)}</b> · sell <b class="num">${zai(quote.liquidation)}</b> <span class="${delta >= 0 ? 'olive' : 'burgundy'} num">${signed(delta)}</span></p>
          </div>
        </div>
        <p class="meta">${esc(def.lore)}</p>
        <ul class="log">${notes}</ul>
        <div class="row">
          <button class="btn za-btn" data-act="inspect-vault" data-id="${esc(item.id)}">${icon('inspect')}<span>Inspect</span></button>
          <button class="btn za-btn" data-kind="primary" data-act="sell-vault" data-id="${esc(item.id)}">Sell for ${zai(quote.liquidation)}</button>
        </div>
      </article>`;
    })
    .join('');
  return `
    <p class="kicker">Vault</p>
    <h1>${items.length ? 'What you keep' : 'The shelf is empty'}</h1>
    <div class="row" style="margin-bottom:12px">
      ${(['value', 'name', 'category', 'acquired'] as const)
        .map((sort) => `<button class="btn za-btn" data-act="sort" data-sort="${sort}" aria-pressed="${session.sort === sort ? 'true' : 'false'}">${sort}</button>`)
        .join('')}
    </div>
    <div class="stack">${cards || '<p class="lede">Buy from the market, win an auction, or finish a duel. The duel’s objects do not enter this shelf.</p><a class="btn za-btn" data-kind="primary" href="#/market">Open the market</a>'}</div>
  `;
};

export const contractsScreen = (session: Session): string => {
  const rows = session.profile.requests
    .map((request) => {
      const progress = Math.min(1, request.target ? request.progress / request.target : 0);
      return `<article class="panel">
        <p class="kicker">${esc(request.scope)} · ${esc(request.status)}</p>
        <h2>${esc(request.title)}</h2>
        <p>${esc(request.description)}</p>
        <p class="num">${request.progress} / ${request.target} · ${request.reward} Zai</p>
        <div class="meter" style="--p:${progress}"><span></span></div>
      </article>`;
    })
    .join('');
  return `
    <p class="kicker">Requests</p>
    <h1>What the house is asking</h1>
    <p class="lede">A persistent request pays your balance once. A duel request pays only the match, and the other player cannot read it.</p>
    <div class="stack">${rows || '<p>No request is open.</p>'}</div>
  `;
};
