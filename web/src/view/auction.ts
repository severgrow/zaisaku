import { definition } from '../../../src/engine/definitions.js';
import { highBid } from '../../../src/engine/auction.js';
import { appraise } from '../../../src/engine/valuation.js';
import { marketContext } from '../../../src/economy/profile.js';
import { plate } from '../ui/art.js';
import { esc, zai } from '../ui/text.js';
import type { Session } from '../session.js';

export const auctionScreen = (session: Session): string => {
  const auction = session.profile.auction;
  if (!auction || auction.status === 'cancelled') {
    return `
      <p class="kicker">Auction</p>
      <h1>One lot on the block</h1>
      <p class="lede">A timed sale with two house bidders. They are simulated, and the screen says so. Your bid is held aside until you win, withdraw, or the clock ends under the reserve.</p>
      <button class="btn za-btn" data-kind="primary" data-act="open-auction">Bring out a lot</button>
    `;
  }
  const def = definition(auction.item.definitionId);
  const quote = appraise(def, auction.item, marketContext(session.profile));
  const high = highBid(auction);
  const mine = auction.bids.filter((bid) => bid.bidderId === session.profile.id && !bid.withdrawn).at(-1);
  const next = high === 0 ? auction.increment : high + auction.increment;
  const history = [...auction.bids].reverse().slice(0, 8);
  return `
    <p class="kicker">Auction · ${esc(auction.status)}</p>
    <h1>${esc(def.name)}</h1>
    <div class="board">
      <article class="lot">
        ${plate(def.artworkRef, def.category)}
        <div>
          <p class="meta">${esc(def.manufacturer)} · ${esc(def.description)}</p>
          <p class="price">Reserve <b class="num">${zai(auction.reserve)}</b> · house would sell near <b class="num">${zai(quote.liquidation)}</b></p>
          <p class="num amber" data-auction-clock>${auction.remainingTicks}s on the clock</p>
        </div>
      </article>
      <div class="stack">
        <section class="panel">
          <p class="kicker">High bid</p>
          <p class="num" style="font-size:28px;margin:0">${high ? zai(high) : '—'}</p>
          <p class="meta">${mine ? `Your live bid ${zai(mine.amount)}. It is reserved, not spent, until settlement.` : 'You have not bid.'}</p>
          ${
            auction.status === 'open'
              ? `<div class="row">
                  <button class="btn za-btn" data-kind="primary" data-act="auction-bid" data-amount="${next}">Bid ${zai(next)}</button>
                  <button class="btn za-btn" data-act="auction-bid" data-amount="${next + auction.increment}">Bid ${zai(next + auction.increment)}</button>
                  <button class="btn za-btn" data-kind="quiet" data-act="withdraw-bid">Withdraw</button>
                  <button class="btn za-btn" data-kind="danger" data-act="cancel-auction">Cancel the lot</button>
                </div>`
              : `<p>${auction.status === 'settled' ? (auction.winnerId === session.profile.id ? 'You won it. It is in the vault.' : 'A house bidder won. Your reserved Zai is back.') : 'The reserve was not met. Every bid is refunded.'}</p>
                 <button class="btn za-btn" data-kind="primary" data-act="open-auction">Bring another lot</button>`
          }
          <p class="meta">Moth and Hinge are simulated house bidders. A bid in the last moments can extend the clock.</p>
        </section>
        <ol class="log">
          ${history
            .map((bid) => `<li>${esc(bid.label)}${bid.simulated ? '' : ''} · ${zai(bid.amount)}${bid.withdrawn ? ' · withdrawn' : ''}</li>`)
            .join('') || '<li>No bids yet.</li>'}
        </ol>
      </div>
    </div>
  `;
};
