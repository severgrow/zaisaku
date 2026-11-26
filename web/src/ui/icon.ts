import auction from './quiet/icons/auction.svg?raw';
import back from './quiet/icons/back.svg?raw';
import check from './quiet/icons/check.svg?raw';
import chevronDown from './quiet/icons/chevron-down.svg?raw';
import chevronRight from './quiet/icons/chevron-right.svg?raw';
import close from './quiet/icons/close.svg?raw';
import duel from './quiet/icons/duel.svg?raw';
import expand from './quiet/icons/expand.svg?raw';
import home from './quiet/icons/home.svg?raw';
import info from './quiet/icons/info.svg?raw';
import inspect from './quiet/icons/inspect.svg?raw';
import interact from './quiet/icons/interact.svg?raw';
import lock from './quiet/icons/lock.svg?raw';
import market from './quiet/icons/market.svg?raw';
import minus from './quiet/icons/minus.svg?raw';
import plus from './quiet/icons/plus.svg?raw';
import requests from './quiet/icons/requests.svg?raw';
import resonance from './quiet/icons/resonance.svg?raw';
import results from './quiet/icons/results.svg?raw';
import settings from './quiet/icons/settings.svg?raw';
import sound from './quiet/icons/sound.svg?raw';
import talk from './quiet/icons/talk.svg?raw';
import vault from './quiet/icons/vault.svg?raw';
import warning from './quiet/icons/warning.svg?raw';
import wire from './quiet/icons/wire.svg?raw';
import world from './quiet/icons/world.svg?raw';

/** Pack 06B glyphs. `currency.svg` stays in the pack and is not shown; Zai remains live text. */

const ICONS = {
  auction,
  back,
  check,
  'chevron-down': chevronDown,
  'chevron-right': chevronRight,
  close,
  duel,
  expand,
  home,
  info,
  inspect,
  interact,
  lock,
  market,
  minus,
  plus,
  requests,
  resonance,
  results,
  settings,
  sound,
  talk,
  vault,
  warning,
  wire,
  world,
} as const;

export type QuietIcon = keyof typeof ICONS;

export const icon = (name: QuietIcon): string =>
  ICONS[name].replace('<svg ', '<svg class="za-glyph" aria-hidden="true" focusable="false" ');
