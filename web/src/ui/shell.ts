import { esc, zai } from './text.js';
import type { Route, Session } from '../session.js';

const LINKS: readonly { route: Route; label: string; dock: boolean }[] = [
  { route: 'home', label: 'Home', dock: true },
  { route: 'duel', label: 'Duel', dock: true },
  { route: 'market', label: 'Market', dock: true },
  { route: 'auction', label: 'Sale', dock: true },
  { route: 'vault', label: 'Vault', dock: true },
  { route: 'contracts', label: 'Requests', dock: false },
  { route: 'results', label: 'Result', dock: false },
  { route: 'settings', label: 'Settings', dock: false },
];

const link = (route: Route, label: string, current: Route): string =>
  `<a href="#/${route === 'home' ? '' : route}" ${current === route ? 'aria-current="page"' : ''}>${esc(label)}</a>`;

export const shell = (session: Session, body: string): string => {
  const free = session.profile.wallets.permanent - session.profile.wallets.reserved;
  return `
    <div class="shell">
      <aside class="side">
        <a class="brand" href="#/">ZAISAKU<small>Quiet floor</small></a>
        <nav aria-label="Rooms">${LINKS.map((item) => link(item.route, item.label, session.route)).join('')}</nav>
        <p class="num amber" style="margin-top:auto">${zai(free)} Zai</p>
      </aside>
      <div class="main">
        <header class="top">
          <a class="brand" href="#/">ZAISAKU<small>Quiet floor</small></a>
          <p class="funds num">${zai(free)} <span class="muted">Zai</span></p>
        </header>
        <main class="screen" id="screen" data-screen="${session.route}" tabindex="-1">${body}</main>
      </div>
      <nav class="dock" aria-label="Floor">${LINKS.filter((item) => item.dock).map((item) => link(item.route, item.label, session.route)).join('')}</nav>
    </div>
  `;
};
