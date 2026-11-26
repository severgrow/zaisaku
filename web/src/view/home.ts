import { activeAtTick } from '../../../src/engine/events.js';
import { icon } from '../ui/icon.js';
import { esc, zai } from '../ui/text.js';
import type { Session } from '../session.js';

const pressed = (on: boolean): string => (on ? 'true' : 'false');

export const homeScreen = (session: Session): string => {
  const profile = session.profile;
  const note = profile.notifications.find((item) => !item.seen) ?? profile.notifications[0];
  const request = profile.requests.find((item) => item.status === 'active') ?? profile.requests[0];
  const event = activeAtTick(profile.seed, profile.tick)[0];
  const progress = request ? Math.min(1, request.target ? request.progress / request.target : 0) : 0;
  const duelOpen = session.duel && session.duel.phase !== 'complete';
  return `
    <p class="kicker">Floor ${profile.tick}</p>
    <h1>${esc(profile.name)}</h1>
    <p class="lede">Everything on this floor has a price. Nothing has a fixed value.</p>
    <nav class="links" aria-label="Rooms">
      <a class="za-btn" id="go-world" href="#/world">${icon('world')}<span class="room-copy"><strong>District</strong><span>Walk the exchange</span></span></a>
      <a class="za-btn" id="start-duel" href="#/duel">${icon('duel')}<span class="room-copy"><strong>${duelOpen ? 'Return' : 'Duel'}</strong><span>${duelOpen ? 'The match is still open' : 'Six rounds, sealed bids'}</span></span></a>
      <a class="za-btn" id="go-market" href="#/market">${icon('market')}<span class="room-copy"><strong>Market</strong><span>Buy with your balance</span></span></a>
      <a class="za-btn" id="go-auction" href="#/auction">${icon('auction')}<span class="room-copy"><strong>Auction</strong><span>One timed lot</span></span></a>
      <a class="za-btn" id="go-vault" href="#/vault">${icon('vault')}<span class="room-copy"><strong>Vault</strong><span>${profile.inventory.length} kept</span></span></a>
    </nav>
    <section class="za-panel">
      <p class="za-label">Permanent balance</p>
      <p class="za-balance num" style="font-size:2rem;margin:4px 0 8px">${zai(profile.wallets.permanent)} <span class="muted">Zai</span></p>
      ${profile.wallets.reserved ? `<p class="meta">Reserved for auction ${zai(profile.wallets.reserved)}</p>` : ''}
    </section>
    <div class="notice za-notice">
      <p class="za-label">Transmission</p>
      <p>${esc(event ? `${event.name}. ${event.summary}` : (note?.text ?? 'The wire is quiet.'))}</p>
    </div>
    <section>
      <p class="kicker">Collector's request</p>
      <h2>${esc(request?.title ?? 'None')}</h2>
      <p class="meta">${esc(request?.description ?? '')}</p>
      <p class="num">${request ? `${request.progress} / ${request.target}` : ''} · ${request ? zai(request.reward) : 0} if you finish</p>
      <div class="meter" style="--p:${progress}"><span></span></div>
    </section>
    <p class="row" style="margin-top:12px">
      <a class="btn za-btn" data-kind="quiet" href="#/contracts">${icon('requests')}<span>Requests</span></a>
      <a class="btn za-btn" data-kind="quiet" href="#/results">${icon('results')}<span>Last result</span></a>
      <a class="btn za-btn" data-kind="quiet" href="#/settings">${icon('settings')}<span>Settings</span></a>
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
      <form class="field" data-act="rename">
        <label class="za-label" for="collector">Collector name</label>
        <div class="row">
          <input class="za-field" id="collector" name="collector" maxlength="24" value="${esc(session.profile.name)}" />
          <button class="btn za-btn" data-kind="primary" type="submit">Save name</button>
        </div>
      </form>
      <section class="za-panel">
        <p class="kicker">Motion</p>
        <div class="row">
          <button class="btn za-btn" data-act="motion" data-value="system" aria-pressed="${pressed(motion === 'system')}">System</button>
          <button class="btn za-btn" data-act="motion" data-value="reduce" aria-pressed="${pressed(motion === 'reduce')}">Reduce</button>
          <button class="btn za-btn" data-act="motion" data-value="allow" aria-pressed="${pressed(motion === 'allow')}">Allow</button>
        </div>
      </section>
      <section class="za-panel">
        <p class="kicker">Sound</p>
        <button class="btn za-btn" data-act="sound" aria-pressed="${pressed(session.settings.sound)}">${icon('sound')}<span>${session.settings.sound ? 'Ticks on' : 'Ticks off'}</span></button>
        <p class="meta">A short tick when you lock a decision. Nothing is recorded outside this device.</p>
      </section>
      <section class="za-panel">
        <p class="kicker">Type</p>
        <button class="btn za-btn" data-act="type" aria-pressed="${pressed(session.settings.largeText)}">${session.settings.largeText ? 'Large type' : 'Ordinary type'}</button>
      </section>
      <section class="za-panel">
        <p class="kicker">Notes kept on this device</p>
        <p>Sessions ${counts.first_session ?? 0} · returns ${counts.return ?? 0}</p>
        <p>Duels ${counts.first_duel ?? 0} · rematches ${counts.rematch ?? 0} · last duel ${counts.duel_duration ?? 0}s</p>
        <p>Auction visits ${counts.auction_join ?? 0} · market actions ${counts.market_action ?? 0} · requests finished ${counts.contract_complete ?? 0}</p>
        <p class="meta">These counters never leave the browser. There is no shop and no third-party tracker.</p>
        <p><a class="btn za-btn" data-kind="quiet" href="#/workshop">${icon('inspect')}<span>Asset workshop</span></a></p>
        <p class="meta">Development preview of temporary stand-in sprites. It is not part of the floor.</p>
      </section>
    </div>
  `;
};
