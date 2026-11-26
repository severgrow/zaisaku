import { viewFor } from '../../../src/engine/view.js';
import { DUEL_INSTRUMENT_HOOK, duelObjectiveGraphic } from '../../../src/world/identity.js';
import { plate } from '../ui/art.js';
import { clock, esc, signed, zai } from '../ui/text.js';
import { mineralUrl } from '../world/mineral.js';
import type { Session } from '../session.js';
import type { PublicItem } from '../../../src/engine/types.js';

const seal = (file: string): string => `<img class="seal" alt="" src="${mineralUrl(file)}" />`;
const portrait = (): string => `<img class="seal portrait" alt="" src="${mineralUrl('identity/vesper-portrait.png')}" />`;

const lot = (item: PublicItem, selected: boolean): string => `
  <button class="lot ${selected ? 'selected' : ''}" data-act="select" data-id="${esc(item.instanceId)}" data-kind="offer">
    ${plate(item.artworkRef, item.category)}
    <span>
      <h3>${esc(item.name)}</h3>
      <p class="meta">${esc(item.manufacturer)} · ${esc(item.category)} · ${esc(item.rarity)} · ${esc(item.conditionWord)}</p>
      <p class="price">Appraisal <b class="num">${zai(item.quote.low)}–${zai(item.quote.high)}</b></p>
      ${item.lingeringRounds && item.lingeringRounds > 1 ? '<p class="meta">Last round on the table</p>' : ''}
    </span>
  </button>
`;

export const duelScreen = (session: Session): string => {
  const duel = session.duel;
  if (!duel) {
    return `
      <p class="kicker">Table</p>
      <h1>A sealed duel</h1>
      <p class="lede">Two collectors. ${1000} Zai each, kept apart from your vault. Six rounds, three objects, one hidden request. Highest net worth takes the table. Draws stand.</p>
      <div class="seal-row">
        ${portrait()}
        ${seal(duelObjectiveGraphic('you', false).file)}
        <div>
          <p class="kicker">Clerk Vesper</p>
          <p class="meta">House player. Simulated. Not a live person. The request stays sealed until you sit.</p>
        </div>
      </div>
      <div data-duel-instrument="${DUEL_INSTRUMENT_HOOK}"></div>
      <button class="btn primary" id="begin-duel" data-act="begin-duel">Sit down</button>
    `;
  }
  const view = viewFor(duel, 'p0');
  const contract = view.contract;
  const progress = contract ? Math.min(1, contract.target ? contract.progress / contract.target : 0) : 0;
  const selected = view.offers.find((item) => item.instanceId === session.selected) ?? null;
  const mine = view.inventory.find((item) => item.instanceId === session.selected) ?? null;
  const lines = view.log.slice(-4);
  return `
    <div class="status">
      <span class="num">R${view.round}/${view.maxRounds}</span>
      <span class="num amber" data-timer>${view.phase === 'decide' && !view.youLocked ? clock(session.clockMs) : '—'}</span>
      <span>You <b class="num">${zai(view.cash)}</b></span>
      <span class="muted">${esc(view.opponentName)} <b class="num">${zai(view.opponentCash)}</b></span>
    </div>
    <div class="board">
      <div class="stack">
        <section class="panel">
          <div class="seal-row">
            ${seal(duelObjectiveGraphic('you', true).file)}
            <div>
              <p class="kicker">Your request · hidden from the other chair</p>
              <h2>${esc(contract?.title ?? 'Sealed')}</h2>
              <p class="meta">${esc(contract?.description ?? '')}</p>
              <p class="num">${contract ? `${contract.progress} / ${contract.target}` : ''} · ${contract ? zai(contract.reward) : ''}</p>
            </div>
          </div>
          <div class="meter" style="--p:${progress}"><span></span></div>
        </section>
        ${view.activeEvents.map((event) => `<p class="notice">${esc(event.name)}. ${esc(event.summary)}</p>`).join('')}
        ${view.rumours.map((rumour) => `<p class="meta">${esc(rumour)}</p>`).join('')}
        ${view.knowledge ? `<p class="teal">${esc(view.knowledge.name)}. ${esc(view.knowledge.summary)}</p>` : ''}
        ${view.warnings.map((warning) => `<p class="burgundy">${esc(warning)}</p>`).join('')}
        <div class="stack" aria-label="Objects on the table">
          ${view.offers.map((item) => lot(item, item.instanceId === session.selected)).join('') || '<p class="muted">The table is clear.</p>'}
        </div>
      </div>
      <div class="stack">
        <section class="panel">
          <div class="seal-row">
            ${portrait()}
            ${seal(duelObjectiveGraphic('opponent', true).file)}
            <div>
              <p class="kicker">Worth now</p>
              <p class="num">${zai(view.worth.netWorth)}</p>
              <p class="meta">Cash ${zai(view.worth.cash)} · shelf ${zai(view.worth.inventoryValue)}</p>
              <p class="meta">${esc(view.opponentName)} is a simulated opponent. Their request stays sealed.</p>
            </div>
          </div>
          <div data-duel-instrument="${DUEL_INSTRUMENT_HOOK}"></div>
        </section>
        <div>
          <p class="kicker">Your shelf</p>
          <div class="chips">
            ${
              view.inventory.length
                ? view.inventory
                    .map(
                      (item) => `<button class="chip ${item.instanceId === session.selected ? 'selected' : ''}" data-act="select" data-id="${esc(item.instanceId)}" data-kind="own"><b>${esc(item.name)}</b><small>${zai(item.quote.liquidation)} sell${item.warning ? ' · warm' : ''}</small></button>`,
                    )
                    .join('')
                : '<p class="muted">Nothing kept yet. Owned objects stay until you sell them.</p>'
            }
          </div>
        </div>
        <div>
          <p class="kicker">Across the table</p>
          <div class="chips">
            ${
              view.opponentInventory.length
                ? view.opponentInventory
                    .map((item) => `<span class="chip"><b>${esc(item.name)}</b><small>${zai(item.quote.liquidation)}</small></span>`)
                    .join('')
                : '<p class="muted">Empty hands.</p>'
            }
          </div>
        </div>
        ${
          view.phase === 'complete'
            ? `<a class="btn primary" href="#/results">Read the result</a>`
            : `<div class="actions">
                <div class="bidbox">
                  <button class="btn" data-act="bid-dec" aria-label="Lower bid">−</button>
                  <span class="num" id="bid-amount">${zai(session.bid)}</span>
                  <button class="btn" data-act="bid-inc" aria-label="Raise bid">+</button>
                  <button class="btn primary grow" data-act="lock-bid" ${selected ? '' : 'disabled'}>Lock bid</button>
                </div>
                <div class="row">
                  <button class="btn" data-act="sell" ${mine ? '' : 'disabled'}>Sell${mine ? ` · ${zai(mine.quote.liquidation)}` : ''}</button>
                  <button class="btn" data-act="inspect" ${selected || mine ? '' : 'disabled'}>Inspect</button>
                  <button class="btn quiet" data-act="pass">Pass</button>
                </div>
                <p class="meta">${view.youLocked ? 'Sealed. Waiting for the other chair.' : 'Lock one action. Both open together.'}</p>
              </div>`
        }
        ${lines.length ? `<ol class="log">${lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ol>` : ''}
        <button class="btn quiet" data-act="abandon">Leave this match</button>
      </div>
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
