import { activeAtTick } from '../../../src/engine/events.js';
import { esc, zai } from '../ui/text.js';
import type { Session } from '../session.js';

export const homeScreen = (session: Session): string => {
  const profile = session.profile;
  const note = profile.notifications.find((item) => !item.seen) ?? profile.notifications[0];
  const request = profile.requests.find((item) => item.status === 'active') ?? profile.requests[0];
  const event = activeAtTick(profile.seed, profile.tick)[0];
  const progress = request ? Math.min(1, request.target ? request.progress / request.target : 0) : 0;
  return `
    <p class="kicker">Floor ${profile.tick}</p>
    <h1>${esc(profile.name)}</h1>
    <p class="lede">Everything on this floor has a price. Nothing has a fixed value.</p>
    <form class="field" data-act="rename">
      <label for="collector">How the house should address you</label>
      <div class="row">
        <input id="collector" name="collector" maxlength="24" value="${esc(profile.name)}" />
        <button class="btn" type="submit">Keep</button>
      </div>
    </form>
    <section class="panel">
      <p class="kicker">Permanent balance</p>
      <p class="num amber" style="font-size:28px;margin:0">${zai(profile.wallets.permanent)} <span class="muted">Zai</span></p>
      <p class="meta">Reserved ${zai(profile.wallets.reserved)} · cosmetic balance is not in use</p>
    </section>
    <section class="panel">
      <p class="kicker">Transmission</p>
      <p>${esc(event ? `${event.name}. ${event.summary}` : (note?.text ?? 'The wire is quiet.'))}</p>
    </section>
    <section class="panel">
      <p class="kicker">Collector's request</p>
      <h2>${esc(request?.title ?? 'None')}</h2>
      <p class="meta">${esc(request?.description ?? '')}</p>
      <p class="num">${request ? `${request.progress} / ${request.target}` : ''} · ${request ? zai(request.reward) : 0} if you finish</p>
      <div class="meter" style="--p:${progress}"><span></span></div>
    </section>
    <nav class="links" aria-label="Rooms">
      <a id="start-duel" href="#/duel"><strong>${session.duel && session.duel.phase !== 'complete' ? 'Return' : 'Duel'}</strong><span>${session.duel && session.duel.phase !== 'complete' ? 'The match is still open' : 'Six rounds, sealed bids'}</span></a>
      <a id="go-market" href="#/market"><strong>Market</strong><span>Buy with your balance</span></a>
      <a id="go-auction" href="#/auction"><strong>Auction</strong><span>One timed lot</span></a>
      <a id="go-vault" href="#/vault"><strong>Vault</strong><span>${profile.inventory.length} kept</span></a>
    </nav>
    <p class="row" style="margin-top:12px">
      <a class="btn quiet" href="#/contracts">Requests</a>
      <a class="btn quiet" href="#/results">Last result</a>
      <a class="btn quiet" href="#/settings">Settings</a>
    </p>
  `;
};

export const settingsScreen = (session: Session): string => {
  const counts = session.profile.analytics.counts;
  const motion = session.settings.reducedMotion;
  return `
    <p class="kicker">House manners</p>
    <h1>Settings</h1>
    <div class="stack">
      <section class="panel">
        <p class="kicker">Motion</p>
        <div class="row">
          <button class="btn ${motion === 'system' ? 'primary' : ''}" data-act="motion" data-value="system">System</button>
          <button class="btn ${motion === 'reduce' ? 'primary' : ''}" data-act="motion" data-value="reduce">Reduce</button>
          <button class="btn ${motion === 'allow' ? 'primary' : ''}" data-act="motion" data-value="allow">Allow</button>
        </div>
      </section>
      <section class="panel">
        <p class="kicker">Sound</p>
        <button class="btn ${session.settings.sound ? 'primary' : ''}" data-act="sound">${session.settings.sound ? 'Ticks on' : 'Ticks off'}</button>
        <p class="meta">A short tick when you lock a decision. Nothing is recorded outside this device.</p>
      </section>
      <section class="panel">
        <p class="kicker">Type</p>
        <button class="btn ${session.settings.largeText ? 'primary' : ''}" data-act="type">${session.settings.largeText ? 'Large type' : 'Ordinary type'}</button>
      </section>
      <section class="panel">
        <p class="kicker">Notes kept on this device</p>
        <p>Sessions ${counts.first_session ?? 0} · returns ${counts.return ?? 0}</p>
        <p>Duels ${counts.first_duel ?? 0} · rematches ${counts.rematch ?? 0} · last duel ${counts.duel_duration ?? 0}s</p>
        <p>Auction visits ${counts.auction_join ?? 0} · market actions ${counts.market_action ?? 0} · requests finished ${counts.contract_complete ?? 0}</p>
        <p class="meta">These counters never leave the browser. There is no shop and no third-party tracker.</p>
      </section>
    </div>
  `;
};
