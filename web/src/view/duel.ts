import { viewFor } from '../../../src/engine/view.js';
import { plate } from '../ui/art.js';
import { clock, esc, signed, zai } from '../ui/text.js';
import { mineralUrl } from '../world/mineral.js';
import type { Session } from '../session.js';
import type { PublicItem } from '../../../src/engine/types.js';

const asset = (file: string): string => esc(mineralUrl(`instrument/${file}`));

const offer = (item: PublicItem, selected: boolean): string => `
  <button class="lot ${selected ? 'selected' : ''}" data-act="select" data-id="${esc(item.instanceId)}" data-kind="offer" aria-pressed="${selected ? 'true' : 'false'}">
    ${plate(item.artworkRef, item.category)}
    <span>
      <h3>${esc(item.name)}</h3>
      <p class="meta">${esc(item.category)} · ${esc(item.conditionWord)}</p>
      <p class="price">Appraisal <b class="num">${zai(item.quote.low)}–${zai(item.quote.high)}</b></p>
    </span>
  </button>
`;

const chip = (item: PublicItem, session: Session, own: boolean): string => {
  const selected = own && item.instanceId === session.selected;
  const body = `${plate(item.artworkRef, item.category)}<span><b>${esc(item.name)}</b><small class="num">${own ? `${zai(item.quote.liquidation)} sell` : zai(item.quote.liquidation)}${item.warning ? ' · warm' : ''}</small></span>`;
  if (!own) return `<span class="chip">${body}</span>`;
  return `<button class="chip ${selected ? 'selected' : ''}" data-act="select" data-id="${esc(item.instanceId)}" data-kind="own" aria-pressed="${selected ? 'true' : 'false'}">${body}</button>`;
};

/** The tray grows with the objects in hand. An empty hand is a sentence, not a row of blank slots. */
const tray = (items: readonly PublicItem[], session: Session, own: boolean, empty: string): string => {
  if (!items.length) return `<p class="muted">${empty}</p>`;
  return `<div class="object-tray">${items.map((item) => chip(item, session, own)).join('')}</div>`;
};

export const duelScreen = (session: Session): string => {
  const duel = session.duel;
  if (!duel) {
    return `
      <p class="kicker">Table</p>
      <h1>A sealed duel</h1>
      <p class="lede">Two collectors. ${1000} Zai each, kept apart from your vault. Six rounds, three objects, one hidden request. Highest net worth takes the table. Draws stand.</p>
      <button class="btn primary" id="begin-duel" data-act="begin-duel">Sit down</button>
      <p class="meta">Your opponent is Clerk Vesper, a house player. Simulated. Not a live person.</p>
    `;
  }
  const view = viewFor(duel, 'p0');
  const contract = view.contract;
  const progress = contract ? Math.min(1, contract.target ? contract.progress / contract.target : 0) : 0;
  const selected = view.offers.find((item) => item.instanceId === session.selected) ?? view.inventory.find((item) => item.instanceId === session.selected) ?? null;
  const mine = view.inventory.find((item) => item.instanceId === session.selected) ?? null;
  const lines = view.log.slice(-2);
  const frame = asset('frame-nine-slice.png');
  const recess = asset('mobile-exchange-recess.png');
  const traySkin = asset('variable-object-tray.png');
  return `
    <div class="instrument" style="--frame:url('${frame}');--recess:url('${recess}');--tray:url('${traySkin}')">
      <header class="instrument-clock">
        <span class="num">R${view.round}/${view.maxRounds}</span>
        <span>You <b class="num">${zai(view.cash)}</b></span>
        <span class="muted">${esc(view.opponentName)} <b class="num">${zai(view.opponentCash)}</b></span>
        <span class="clock-face" data-timer>${view.phase === 'decide' && !view.youLocked ? clock(session.clockMs) : '—'}</span>
      </header>
      <div class="exchange">
        <div class="exchange-body" aria-label="Objects on the table">
          ${view.offers.map((item) => offer(item, item.instanceId === session.selected)).join('') || '<p class="muted">The table is clear.</p>'}
        </div>
      </div>
      <div class="instrument-hold">
        <div>
          <p class="kicker">Your shelf</p>
          ${tray(view.inventory, session, true, 'Nothing kept yet.')}
        </div>
        <div>
          <p class="kicker">Across the table</p>
          ${tray(view.opponentInventory, session, false, 'Empty hands.')}
        </div>
      </div>
      <section class="instrument-detail">
        <p class="kicker">Your request · hidden from the other chair</p>
        <h2>${esc(contract?.title ?? 'Sealed')}</h2>
        <p class="meta">${esc(contract?.description ?? '')}</p>
        <p class="num">${contract ? `${contract.progress} / ${contract.target}` : ''} · ${contract ? zai(contract.reward) : ''}</p>
        <div class="meter" style="--p:${progress}"><span></span></div>
        ${selected ? `<p class="picked"><b>${esc(selected.name)}</b> · appraisal <b class="num">${zai(selected.quote.low)}–${zai(selected.quote.high)}</b></p>` : '<p class="muted">Choose an object on the table.</p>'}
        <p class="meta">Worth <b class="num">${zai(view.worth.netWorth)}</b> · cash ${zai(view.worth.cash)} · shelf ${zai(view.worth.inventoryValue)}</p>
        ${view.warnings.map((warning) => `<p class="burgundy">${esc(warning)}</p>`).join('')}
      </section>
      ${
        view.phase === 'complete'
          ? `<a class="btn primary" href="#/results">Read the result</a>`
          : `<div class="actions">
              <div class="bidbox">
                <button class="btn bid-key" data-act="bid-dec" aria-label="Lower bid"><img alt="" src="${asset('bid-minus.png')}" width="40" height="40" /></button>
                <span class="num" id="bid-amount">${zai(session.bid)}</span>
                <button class="btn bid-key" data-act="bid-inc" aria-label="Raise bid"><img alt="" src="${asset('bid-plus.png')}" width="40" height="40" /></button>
                <button class="btn primary grow" data-act="lock-bid" ${view.offers.some((item) => item.instanceId === session.selected) ? '' : 'disabled'}>Lock bid</button>
              </div>
              <div class="row">
                <button class="btn" data-act="sell" ${mine ? '' : 'disabled'}>Sell${mine ? ` · ${zai(mine.quote.liquidation)}` : ''}</button>
                <button class="btn" data-act="inspect" ${selected ? '' : 'disabled'}>Inspect</button>
                <button class="btn quiet" data-act="pass">Pass</button>
              </div>
              <p class="meta">${view.youLocked ? 'Sealed. Waiting for the other chair.' : 'Lock one action. Both open together.'}</p>
            </div>`
      }
      ${lines.length ? `<ol class="log">${lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ol>` : ''}
      <button class="btn quiet" data-act="abandon">Leave this match</button>
    </div>
  `;
};

export const resultsScreen = (session: Session): string => {
  const result = session.lastResult ?? session.duel?.result ?? null;
  if (!result) {
    return `<p class="kicker">Result</p><h1>No match yet</h1><p class="lede">Finish a duel and the house will lay out the worth of both chairs.</p><a class="btn primary" href="#/duel">Sit a duel</a>`;
  }
  const [you, them] = result.scores;
  const title = result.winner === 'draw' ? 'The table is drawn' : result.winner === 'p0' ? 'You take the table' : `${them?.name ?? 'The other chair'} takes the table`;
  const line = (label: string, value: string) => `<div><span>${label}</span><b class="num">${value}</b></div>`;
  return `
    <p class="kicker">Result</p>
    <h1 class="winner">${esc(title)}</h1>
    <div class="board">
      ${[you, them]
        .filter((score) => score)
        .map(
          (score) => `<section class="panel score">
            <h2>${esc(score!.name)}</h2>
            ${line('Started', zai(score!.starting))}
            ${line('Final cash', zai(score!.cash))}
            ${line('Shelf, if sold', zai(score!.inventoryValue))}
            ${line('Request rewards, already in the cash', zai(score!.contractRewards))}
            ${line('Net worth', zai(score!.netWorth))}
            ${line('Profit', signed(score!.profit))}
          </section>`,
        )
        .join('')}
    </div>
    <ol class="log">${result.decisions.flatMap((round) => round.notes.map((note) => `<li>Round ${round.round}. ${esc(note)}</li>`)).join('')}</ol>
    <div class="row">
      <button class="btn primary" data-act="begin-duel">Sit again</button>
      <a class="btn" href="#/home">Home</a>
    </div>
  `;
};
