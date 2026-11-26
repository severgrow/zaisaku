import { icon, type QuietIcon } from './icon.js';
import { esc, zai } from './text.js';
import type { Route, Session } from '../session.js';

const LINKS: readonly { route: Route; label: string; dock: boolean; glyph: QuietIcon }[] = [
  { route: 'home', label: 'Home', dock: true, glyph: 'home' },
  { route: 'duel', label: 'Duel', dock: true, glyph: 'duel' },
  { route: 'market', label: 'Market', dock: true, glyph: 'market' },
  { route: 'auction', label: 'Auction', dock: true, glyph: 'auction' },
  { route: 'vault', label: 'Vault', dock: true, glyph: 'vault' },
  { route: 'world', label: 'District', dock: false, glyph: 'world' },
  { route: 'contracts', label: 'Requests', dock: false, glyph: 'requests' },
  { route: 'results', label: 'Result', dock: false, glyph: 'results' },
  { route: 'settings', label: 'Settings', dock: false, glyph: 'settings' },
];

const link = (item: (typeof LINKS)[number], current: Route): string =>
  `<a class="za-btn" href="#/${item.route === 'home' ? '' : item.route}" ${current === item.route ? 'aria-current="page"' : ''}>${icon(item.glyph)}<span>${esc(item.label)}</span></a>`;

export const shell = (session: Session, body: string): string => {
  const free = session.profile.wallets.permanent - session.profile.wallets.reserved;
  return `
    <div class="shell">
      <aside class="side">
        <a class="brand" href="#/">ZAISAKU<small>Quiet floor</small></a>
        <nav class="za-nav" aria-label="Rooms">${LINKS.map((item) => link(item, session.route)).join('')}</nav>
        <p class="funds za-balance num">${zai(free)} <span>Zai</span></p>
      </aside>
      <div class="main">
        <header class="top">
          <a class="brand" href="#/">ZAISAKU<small>Quiet floor</small></a>
          <p class="funds za-balance num">${zai(free)} <span>Zai</span></p>
        </header>
        <main class="screen" id="screen" data-screen="${session.route}" tabindex="-1">${body}</main>
      </div>
      <nav class="dock za-nav" aria-label="Floor">${LINKS.filter((item) => item.dock).map((item) => link(item, session.route)).join('')}</nav>
    </div>
  `;
};
