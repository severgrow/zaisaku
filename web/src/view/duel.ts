import { definition } from '../../../src/engine/definitions.js';
import { validateAction } from '../../../src/engine/duel.js';
import { viewFor } from '../../../src/engine/view.js';
import { activeTheme } from '../../../src/presentation/themes.js';
import type { DuelAction, PublicItem } from '../../../src/engine/types.js';
import type { ArmedAction, Session } from '../session.js';
import { plate } from '../ui/art.js';
import { duelAsset } from '../ui/assets.js';
import { clock, esc, signed, zai } from '../ui/text.js';

let paintedKey = '';

const themeStyle = (): string => {
  const theme = activeTheme();
  const materials = theme.materials;
  const lighting = theme.lighting;
  if (!materials) return '';
  const compartment = theme.frames ? `--compartment:url('${esc(duelAsset(theme.frames.compartment))}')` : '';
  return [
    `--theme-bone:${materials.bone}`,
    `--theme-alloy:${materials.alloy}`,
    `--theme-amber:${materials.amber}`,
    `--theme-burgundy:${materials.burgundy}`,
    `--theme-ink:${materials.ink}`,
    `--theme-ground:${materials.ground}`,
    `--amber:${materials.amber}`,
    `--burgundy:${materials.burgundy}`,
    `--light:${lighting?.key ?? materials.amber}`,
    `--ambient:${lighting?.ambient ?? materials.alloy}`,
    compartment,
  ]
    .filter(Boolean)
    .join(';');
};

const img = (file: string, className: string): string =>
  `<img class="pixel ${className}" alt="" src="${esc(duelAsset(file))}" />`;

const holds = (items: readonly PublicItem[], id: string): boolean => items.some((item) => item.definitionId === id);

const bothTwins = (items: readonly PublicItem[]): boolean => holds(items, 'twin-left') && holds(items, 'twin-right');

const lensNotes = (inventory: readonly PublicItem[]): number => {
  let extra = 0;
  for (const item of inventory) {
    const effect = definition(item.definitionId).effectDefs.find((entry) => entry.type === 'memory_lens');
    if (effect) extra = Math.max(extra, Number(effect.params.extraReveals) || 0);
  }
  return 1 + extra;
};

const fx = (item: PublicItem, scope: 'table' | 'you' | 'them', session: Session, magnet: boolean, twins: boolean): string => {
  const names: string[] = [];
  if (scope !== 'table' && item.definitionId === 'amber-hourglass') names.push('fx-amber');
  if (magnet && item.category === 'electronics') names.push('fx-magnet');
  if (item.warning) names.push('fx-warn');
  if (scope === 'you' && item.definitionId === 'tomorrow-receiver') names.push('fx-wave');
  if (twins && (item.definitionId === 'twin-left' || item.definitionId === 'twin-right')) names.push('fx-twin');
  const scan = session.scan;
  if (scan && scan.instanceId === item.instanceId && (scan.round === session.duel?.round || scan.round + 1 === session.duel?.round)) {
    names.push('fx-scan');
  }
  if (session.armed?.type === 'inspect' && session.armed.instanceId === item.instanceId) names.push('fx-scan');
  return names.join(' ');
};

const mark = (name: string): string => esc(name.trim().slice(0, 1).toUpperCase() || '·');

const offerCard = (item: PublicItem, session: Session, magnet: boolean): string => {
  const selected = item.instanceId === session.selected;
  return `
    <button class="lot ${selected ? 'selected' : ''} ${fx(item, 'table', session, magnet, false)}" data-act="select" data-id="${esc(item.instanceId)}" data-kind="offer" aria-pressed="${selected ? 'true' : 'false'}">
      <span class="recess">${plate(item.artworkRef, item.category)}</span>
      <span class="lot-copy">
        <h3>${esc(item.name)}</h3>
        <p class="meta">${esc(item.category)} · ${esc(item.rarity)} · ${esc(item.conditionWord)}</p>
        <p class="price">Appraisal <b class="num">${zai(item.quote.low)}–${zai(item.quote.high)}</b></p>
        ${item.lingeringRounds && item.lingeringRounds > 1 ? '<p class="meta">Last round on the table</p>' : ''}
        ${item.revealed.some((note) => note.key !== 'maker-mark') ? `<p class="meta">${item.revealed.filter((note) => note.key !== 'maker-mark').map((note) => `${esc(note.label)}: ${esc(note.value)}`).join(' · ')}</p>` : ''}
      </span>
    </button>
  `;
};

const chip = (item: PublicItem, session: Session, scope: 'you' | 'them', magnet: boolean, twins: boolean): string => {
  const selected = scope === 'you' && item.instanceId === session.selected;
  const twin = twins && (item.definitionId === 'twin-left' || item.definitionId === 'twin-right') ? 'data-twin' : '';
  const body = `
    <span class="recess">${plate(item.artworkRef, item.category)}${item.definitionId === 'amber-hourglass' ? `${img('amber-ring.png', 'ring')}${img('amber-ring.png', 'ring ring-late')}` : ''}</span>
    <span><b>${esc(item.name)}</b><small class="num">${scope === 'you' ? `${zai(item.quote.liquidation)} sell` : zai(item.quote.liquidation)}${item.warning ? ' · warm' : ''}</small></span>
  `;
  if (scope === 'them') {
    return `<span class="chip ${fx(item, scope, session, magnet, twins)}" ${twin}>${body}</span>`;
  }
  return `<button class="chip ${selected ? 'selected' : ''} ${fx(item, scope, session, magnet, twins)}" ${twin} data-act="select" data-id="${esc(item.instanceId)}" data-kind="own" aria-pressed="${selected ? 'true' : 'false'}">${body}</button>`;
};

const tray = (items: readonly PublicItem[], session: Session, scope: 'you' | 'them', magnet: boolean): string => {
  const twins = bothTwins(items);
  if (!items.length) {
    return `<p class="muted">${scope === 'you' ? 'Nothing kept yet. Owned objects stay until you sell them.' : 'Empty hands.'}</p>`;
  }
  return `<div class="shelf-block">${twins ? `<p class="resonance">${img('chamber.png', 'chamber')}<span>The pair is in resonance.</span></p>` : ''}<div class="tray" data-twin-tray>${items.map((item) => chip(item, session, scope, magnet, twins)).join('')}${twins ? '<svg class="twin-link" aria-hidden="true"></svg>' : ''}</div></div>`;
};

const explain = (session: Session, armed: ArmedAction): { text: string; reason: string | null; label: string } => {
  const duel = session.duel;
  if (!duel) return { text: '', reason: 'The match is not open.', label: 'Confirm' };
  const view = viewFor(duel, 'p0');
  const find = (id: string) => view.offers.find((item) => item.instanceId === id) ?? view.inventory.find((item) => item.instanceId === id) ?? null;
  if (armed.type === 'pass') {
    return {
      text: 'Pass. You bid on nothing, sell nothing, and read nothing this round. Your match balance stays.',
      reason: validateAction(duel, 'p0', { type: 'pass' }),
      label: 'Confirm pass',
    };
  }
  const item = find(armed.instanceId);
  const name = item?.name ?? 'that object';
  if (armed.type === 'bid') {
    const action: DuelAction = { type: 'bid', instanceId: armed.instanceId, amount: session.bid };
    const next = view.cash - session.bid;
    return {
      text: `Seal a bid of ${zai(session.bid)} Zai for ${name}. If yours is the only highest bid, you pay it and take the object. A tie leaves it on the table. If the bid wins, this match’s balance becomes ${zai(next)}. Clerk Vesper does not see the amount until both chairs have sealed.`,
      reason: validateAction(duel, 'p0', action),
      label: 'Confirm bid',
    };
  }
  if (armed.type === 'sell') {
    const pay = item?.quote.liquidation ?? 0;
    return {
      text: `Sell ${name} to the house for ${zai(pay)} Zai. It leaves your shelf. Only this match’s balance changes.`,
      reason: validateAction(duel, 'p0', { type: 'sell', instanceId: armed.instanceId }),
      label: 'Confirm sale',
    };
  }
  const notes = lensNotes(view.inventory);
  const lens = notes > 1 ? ` Memory Lens reads ${notes} notes.` : '';
  return {
    text: `Inspect ${name}. The bench reads the next ${notes === 1 ? 'hidden note' : `${notes} hidden notes`}.${lens} The other chair is not shown what you learned.`,
    reason: validateAction(duel, 'p0', { type: 'inspect', instanceId: armed.instanceId }),
    label: 'Confirm inspect',
  };
};

const decision = (session: Session): string => {
  const duel = session.duel;
  if (!duel) return '';
  const view = viewFor(duel, 'p0');
  if (view.phase === 'complete') return `<a class="btn primary" href="#/results">Read the result</a>`;
  if (view.youLocked) {
    return `
      <div class="sealed-state">
        <div class="seal-row">${img('sealed-closed.png', 'seal')}${img('status-seal.png', 'seal-mark')}</div>
        <p>Your action is sealed. ${view.opponentLocked ? `${esc(view.opponentName)} is sealed as well.` : `${esc(view.opponentName)} has not sealed yet.`} The choice itself stays hidden.</p>
      </div>
    `;
  }
  const offer = view.offers.find((item) => item.instanceId === session.selected) ?? null;
  const owned = view.inventory.find((item) => item.instanceId === session.selected) ?? null;
  const bidAction: DuelAction | null = offer ? { type: 'bid', instanceId: offer.instanceId, amount: session.bid } : null;
  const bidBlock = bidAction ? validateAction(duel, 'p0', bidAction) : 'Choose an object on the table.';
  const sellBlock = owned ? validateAction(duel, 'p0', { type: 'sell', instanceId: owned.instanceId }) : 'Choose an object you own.';
  const inspectTarget = offer ?? owned;
  const inspectBlock = inspectTarget ? validateAction(duel, 'p0', { type: 'inspect', instanceId: inspectTarget.instanceId }) : 'Choose an object.';
  const short = view.cash < view.minBid || (!!bidAction && session.bid > view.cash);
  const armed = session.armed;
  const detail = armed ? explain(session, armed) : null;
  return `
    <div class="bidbox ${short ? 'short' : ''}">
      <button class="btn mech" data-act="bid-dec" aria-label="Lower bid by ${view.increment}">−</button>
      <span class="bid-read">
        <b class="num" id="bid-amount">${zai(session.bid)}</b>
        <small>steps of ${view.increment}</small>
      </span>
      <button class="btn mech" data-act="bid-inc" aria-label="Raise bid by ${view.increment}">+</button>
    </div>
    ${short ? `<p class="short-note">${img('locked-bar.png', 'lock-icon')}<span>Not enough Zai for this bid. The match balance is ${zai(view.cash)}.</span></p>` : ''}
    <div class="row acts">
      <button class="btn ${armed?.type === 'bid' ? 'primary' : ''}" data-act="arm" data-kind="bid" ${offer ? `data-id="${esc(offer.instanceId)}"` : ''} ${bidBlock ? 'disabled' : ''}>Bid</button>
      <button class="btn ${armed?.type === 'inspect' ? 'primary' : ''}" data-act="arm" data-kind="inspect" ${inspectTarget ? `data-id="${esc(inspectTarget.instanceId)}"` : ''} ${inspectBlock ? 'disabled' : ''}>Inspect</button>
      <button class="btn ${armed?.type === 'sell' ? 'primary' : ''}" data-act="arm" data-kind="sell" ${owned ? `data-id="${esc(owned.instanceId)}"` : ''} ${sellBlock ? 'disabled' : ''}>Sell${owned ? ` · ${zai(owned.quote.liquidation)}` : ''}</button>
      <button class="btn quiet ${armed?.type === 'pass' ? 'primary' : ''}" data-act="arm" data-kind="pass">Pass</button>
    </div>
    ${
      detail
        ? `<div class="xu-confirm" role="status">
            ${armed?.type === 'inspect' ? img('lens.png', 'lens-icon') : ''}
            <p>${esc(detail.text)}</p>
            ${detail.reason ? `<p class="burgundy">${esc(detail.reason)}</p>` : ''}
            <div class="row">
              <button class="btn primary" data-act="confirm" ${detail.reason ? 'disabled' : ''}>${esc(detail.label)}</button>
              <button class="btn quiet" data-act="cancel-arm">Back</button>
            </div>
          </div>`
        : '<p class="meta">Choose, then confirm. Nothing is sealed until you do. The clock stays on the instrument.</p>'
    }
    <p class="keys">Keys: 1–9 select, +/− bid, B I S P, Enter confirms.</p>
  `;
};

const portrait = (name: string, role: string): string => `
  <div class="portrait">
    ${img('portrait-ornate.png', 'portrait-frame')}
    <span class="monogram" aria-hidden="true">${mark(name)}</span>
    <span class="sr">${esc(role)} ${esc(name)}</span>
  </div>
`;

export const duelScreen = (session: Session): string => {
  const theme = activeTheme();
  const duel = session.duel;
  if (!duel) {
    return `
      <div class="xu intro" data-theme="${esc(theme.id)}" style="${themeStyle()}">
        ${img('exchange-compact.png', 'crown-still')}
        <p class="kicker">Exchange instrument</p>
        <h1>A sealed duel</h1>
        <p class="lede">Two collectors. 1,000 Zai each, kept apart from your vault. Six rounds, three objects, one hidden request. Highest net worth takes the table. Draws stand.</p>
        <button class="btn primary" id="begin-duel" data-act="begin-duel">Sit down</button>
        <p class="meta">Your opponent is Clerk Vesper, a house player. Simulated. Not a live person.</p>
      </div>
    `;
  }
  const view = viewFor(duel, 'p0');
  const key = `${duel.seed}:${view.round}:${view.phase}`;
  const entering = key !== paintedKey;
  paintedKey = key;
  const contract = view.contract;
  const progress = contract ? Math.min(1, contract.target ? contract.progress / contract.target : 0) : 0;
  const magnet = holds(view.inventory, 'null-magnet') || holds(view.opponentInventory, 'null-magnet');
  const remain = duel.rules.decisionMs ? session.clockMs / duel.rules.decisionMs : 0;
  const urgent = view.phase === 'decide' && !view.youLocked && session.clockMs <= 5_000;
  const lines = view.log.slice(-3);
  const clockText = view.phase === 'decide' && !view.youLocked ? clock(session.clockMs) : view.youLocked ? 'Sealed' : '—';
  return `
    <div class="xu ${entering ? 'round-enter' : ''}" data-theme="${esc(theme.id)}" data-round="${view.round}" style="${themeStyle()}">
      <section class="xu-opp" aria-label="Other chair">
        ${img('opponent-console.png', 'console-mark')}
        <div class="identity">
          ${portrait(view.opponentName, 'Other chair')}
          <div>
            <p class="kicker">Other chair${view.opponentSimulated ? ' · simulated' : ''}</p>
            <h2>${esc(view.opponentName)}</h2>
            <p class="num">${zai(view.opponentCash)} <span class="muted">Zai</span></p>
            <p class="status-lamp ${view.opponentLocked ? 'is-sealed' : ''}">${view.opponentLocked ? 'Sealed' : 'Choosing'} <span class="sr">The action stays hidden.</span></p>
          </div>
        </div>
        <div>
          <p class="kicker">Held, in the open</p>
          ${tray(view.opponentInventory, session, 'them', magnet)}
        </div>
      </section>
      <section class="xu-center" aria-label="Table">
        <div class="roundbar">
          <span class="num round-no">R${view.round}/${view.maxRounds}</span>
          ${img('hourglass.png', 'hour')}
          <span class="num amber clock-face ${urgent ? 'urgent' : ''}" data-timer style="--remain:${remain}">${clockText}</span>
          <span class="remain" style="--remain:${remain}"></span>
        </div>
        <div class="crown">
          ${img('exchange-compact.png', 'crown-mobile')}
          ${img('exchange-table.png', 'crown-desk')}
        </div>
        <div class="offers" aria-label="Objects on the table">
          ${view.offers.map((item) => offerCard(item, session, magnet)).join('') || '<p class="muted">The table is clear.</p>'}
        </div>
        <section class="wire panel">
          <div class="wire-head">
            ${img('receiver.png', 'receiver')}
            <div>
              <p class="kicker">Market transmission</p>
              ${view.activeEvents.map((event) => `<p>${esc(event.name)}. ${esc(event.summary)}</p>`).join('') || '<p class="muted">The wire is quiet.</p>'}
              ${view.rumours.map((rumour) => `<p class="meta">${esc(rumour)}</p>`).join('')}
            </div>
          </div>
          ${
            view.knowledge
              ? `<div class="private-wire fx-wave">${img('waveform.png', 'wave')}<p><b>${esc(view.knowledge.name)}.</b> ${esc(view.knowledge.summary)}</p></div>`
              : ''
          }
          ${view.warnings.map((warning) => `<p class="burgundy">${esc(warning)}</p>`).join('')}
        </section>
        ${lines.length ? `<ol class="log">${lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ol>` : ''}
      </section>
      <section class="xu-player" aria-label="Your chair">
        <div class="identity">
          ${portrait(view.youName, 'Your chair')}
          <div>
            <p class="kicker">Your chair</p>
            <h2>${esc(view.youName)}</h2>
            <p class="num">${zai(view.cash)} <span class="muted">Zai</span></p>
            <p class="meta">Worth ${zai(view.worth.netWorth)} · shelf ${zai(view.worth.inventoryValue)}</p>
            <p class="status-lamp ${view.youLocked ? 'is-sealed' : ''}">${view.youLocked ? 'Sealed' : 'Open'}</p>
          </div>
        </div>
        <section class="contract panel">
          ${img('envelope.png', 'env')}
          <div>
            <p class="kicker">Private contract · hidden from the other chair</p>
            <h2>${esc(contract?.title ?? 'Sealed')}</h2>
            <p class="meta">${esc(contract?.description ?? '')}</p>
            <p class="num">${contract ? `${contract.progress} / ${contract.target}` : ''} · ${contract ? zai(contract.reward) : ''}</p>
            <div class="meter" style="--p:${progress}"><span></span></div>
          </div>
        </section>
        <div>
          <p class="kicker">Your shelf</p>
          ${tray(view.inventory, session, 'you', magnet)}
        </div>
        <div class="actions xu-actions">
          ${decision(session)}
        </div>
        <button class="btn quiet leave" data-act="abandon">Leave this match</button>
      </section>
    </div>
  `;
};

export const resultsScreen = (session: Session): string => {
  const theme = activeTheme();
  const result = session.lastResult ?? session.duel?.result ?? null;
  if (!result) {
    return `<div class="xu" data-theme="${esc(theme.id)}" style="${themeStyle()}"><p class="kicker">Result</p><h1>No match yet</h1><p class="lede">Finish a duel and the house will lay out the worth of both chairs.</p><a class="btn primary" href="#/duel">Sit a duel</a></div>`;
  }
  const [you, them] = result.scores;
  const title = result.winner === 'draw' ? 'The table is drawn' : result.winner === 'p0' ? 'You take the table' : `${them?.name ?? 'The other chair'} takes the table`;
  const line = (label: string, value: string) => `<div><span>${label}</span><b class="num">${value}</b></div>`;
  return `
    <div class="xu xu-result" data-theme="${esc(theme.id)}" style="${themeStyle()}">
      <p class="kicker">Result</p>
      <h1 class="winner">${esc(title)}</h1>
      ${img('result-plate.png', 'result-banner')}
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
        <a class="btn" href="#/world">District</a>
        <a class="btn" href="#/home">Home</a>
      </div>
    </div>
  `;
};

export const linkTwins = (): void => {
  document.querySelectorAll('[data-twin-tray]').forEach((tray) => {
    if (!(tray instanceof HTMLElement)) return;
    const svg = tray.querySelector('svg.twin-link');
    if (!(svg instanceof SVGSVGElement)) return;
    const nodes = [...tray.querySelectorAll('[data-twin]')].filter((node): node is HTMLElement => node instanceof HTMLElement);
    if (nodes.length < 2) {
      svg.replaceChildren();
      return;
    }
    const host = tray.getBoundingClientRect();
    const width = Math.max(1, host.width);
    const height = Math.max(1, host.height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const [first, second] = nodes;
    if (!first || !second) return;
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(a.left + a.width / 2 - host.left));
    line.setAttribute('y1', String(a.top + a.height / 2 - host.top));
    line.setAttribute('x2', String(b.left + b.width / 2 - host.left));
    line.setAttribute('y2', String(b.top + b.height / 2 - host.top));
    svg.replaceChildren(line);
  });
};
