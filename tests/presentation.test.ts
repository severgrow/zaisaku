import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFINITIONS } from '../src/engine/definitions.js';
import { CATALOGUE_IDS } from '../src/presentation/catalogue.js';
import { ACTIVE_THEME_ID, VISUAL_THEMES, activeTheme } from '../src/presentation/themes.js';

describe('visual themes', () => {
  it('keeps the exchange terminal as the only implemented theme', () => {
    expect(VISUAL_THEMES.map((theme) => theme.id)).toEqual([
      'exchange-district',
      'northern-basin',
      'industrial-belt',
      'cultivation-district',
      'unmapped-territories',
    ]);
    expect(ACTIVE_THEME_ID).toBe('exchange-district');
    const live = VISUAL_THEMES.filter((theme) => theme.implemented);
    expect(live.map((theme) => theme.id)).toEqual(['exchange-district']);
    const theme = activeTheme();
    expect(theme.frames?.table).toBeTruthy();
    expect(theme.materials?.amber).toBeTruthy();
    for (const slot of VISUAL_THEMES.filter((item) => !item.implemented)) {
      expect(slot.frames).toBeNull();
      expect(slot.materials).toBeNull();
    }
  });
});

describe('catalogue plates', () => {
  it('binds pack 04 pictures to existing definition ids', () => {
    const ids = new Set(DEFINITIONS.map((def) => def.id));
    const files = readdirSync('web/public/mineral/catalogue').filter((name) => name.endsWith('.png'));
    expect(files.map((name) => name.replace(/^item-/, '').replace(/\.png$/, '')).sort()).toEqual([...CATALOGUE_IDS].sort());
    for (const id of CATALOGUE_IDS) expect(ids.has(id)).toBe(true);
    expect(existsSync('web/public/mineral/duel/pack05_duel_ui_set_a.png')).toBe(false);
    expect(existsSync('web/public/mineral/duel/pack05_duel_ui_set_b.png')).toBe(false);
  });
});
