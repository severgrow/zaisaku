/** Runtime pictures. Logical cells stay 32px. Pack 04 floors and architecture are 64px sources. Pack 07 adds plates and joins. Characters stay Pack 02. */

import { ceramicTransitionKeys, pavingToPathKeys } from '../../../src/world/connectors.js';

export const mineralUrl = (file: string): string => new URL(`mineral/${file}`, document.baseURI).toString();

/** Loose props Pack 04 does not replace. */
export const MINERAL_TILES: Readonly<Record<string, string>> = {
  awning: 'architecture-awning.png',
  pipe: 'architecture-pipe.png',
  vent: 'architecture-vent.png',
  counter: 'furniture-counter.png',
  tree: 'flora-tree.png',
  reed: 'flora-reed.png',
  lantern: 'flora-lantern.png',
  vein: 'flora-vein.png',
  lamp: 'object-lamp.png',
  terminal: 'object-terminal.png',
  plate: 'collectible-collectible-plate.png',
};

export const FLOOR_FILES: Readonly<Record<string, string>> = {
  'floor-mineral-paving': 'floors/floor-mineral-paving.png',
  'floor-bone-ceramic': 'floors/floor-bone-ceramic.png',
  'floor-resonance-path': 'floors/floor-resonance-path.png',
  'floor-interior-floor': 'floors/floor-interior-floor.png',
  'floor-industrial-metal': 'floors/floor-industrial-metal.png',
  'floor-soil': 'floors/floor-soil.png',
  'floor-residence-inlay': 'floors/residence-inlay.png',
};

const SIDES = ['n', 'e', 's', 'w'] as const;

export const TRANSITION_FILES: Readonly<Record<string, string>> = Object.fromEntries([
  ...SIDES.flatMap((side) => [[`mineral-paving-to-soil-${side}`, `transitions/mineral-paving-to-soil-${side}.png`]]),
  ...ceramicTransitionKeys().map((key) => [key, `transitions/${key}.png`]),
  ...pavingToPathKeys().map((key) => [key, `transitions/${key}.png`]),
]);

export const ARCHITECTURE_FILES: readonly string[] = [
  'door-frame-open.png',
  'door-frame-open-e.png',
  'door-frame-open-w.png',
  'window-open.png',
  'window-frame-open-e.png',
  'window-frame-open-w.png',
  'wall-straight-ew.png',
  'wall-straight-ns.png',
  'wall-inner-ne.png',
  'wall-inner-es.png',
  'wall-inner-sw.png',
  'wall-inner-wn.png',
  'wall-outer-ne.png',
  'wall-outer-es.png',
  'wall-outer-sw.png',
  'wall-outer-wn.png',
  'wall-t-nes.png',
  'wall-t-esw.png',
  'wall-t-swn.png',
  'wall-t-wne.png',
  'wall-cross.png',
  'wall-end-n.png',
  'wall-end-e.png',
  'wall-end-s.png',
  'wall-end-w.png',
  'roof-straight-ew.png',
  'roof-straight-ew-bottom.png',
  'roof-straight-ns.png',
  'wall-straight-ew-top-bridge.png',
  'awning-north-door.png',
  'roof-end-n.png',
  'roof-end-e.png',
  'roof-end-s.png',
  'roof-end-w.png',
  'roof-corner-ne.png',
  'roof-corner-es.png',
  'roof-corner-sw.png',
  'roof-corner-wn.png',
  'rail-straight-ew.png',
  'rail-straight-ns.png',
  'rail-corner-ne.png',
  'rail-corner-es.png',
  'rail-corner-sw.png',
  'rail-corner-wn.png',
  'rail-end-n.png',
  'rail-end-e.png',
  'rail-end-s.png',
  'rail-end-w.png',
  'rail-t-nes.png',
  'rail-t-esw.png',
  'rail-t-swn.png',
  'rail-t-wne.png',
  'rail-cross.png',
];

export const FURNITURE_FILES: Readonly<Record<string, string>> = {
  'furniture-shelf': 'furniture/furniture-display-shelf-64.png',
  'furniture-glass': 'furniture/furniture-glass-display-64.png',
  'furniture-pedestal': 'furniture/furniture-display-pedestal-64.png',
  'furniture-shelf-native': 'furniture/furniture-display-shelf.png',
  'furniture-glass-native': 'furniture/furniture-glass-display.png',
  'furniture-pedestal-native': 'furniture/furniture-display-pedestal.png',
  'glass-case-base': 'furniture/glass-case-base.png',
  'glass-case-front': 'furniture/glass-case-front.png',
  'sleeping-ledge': 'furniture/sleeping-ledge.png',
  'work-bench': 'furniture/work-bench.png',
  'bedside-cabinet': 'furniture/bedside-cabinet.png',
  'exchange-counter': 'furniture/exchange-counter.png',
  'paper-rack': 'furniture/paper-rack.png',
};

export const PORTRAITS: Readonly<Record<string, string>> = {
  ivo: 'portraits/portrait-ivo.png',
  ness: 'portraits/portrait-ness.png',
  archivist: 'portraits/portrait-archivist.png',
};

export const PLAYER_FACINGS = ['n', 'e', 's', 'w'] as const;
export const NPCS = ['ivo', 'ness', 'archivist'] as const;

export const playerFile = (facing: string, frame: number): string => `player-${facing}-${frame}.png`;
export const npcFile = (id: string, facing: string): string => `person-${id}-${facing}.png`;

