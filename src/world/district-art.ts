import type { AssetCategory, AssetRecord } from './assets.js';

type Candidate = readonly [id: string, file: string, category: AssetCategory, width: number, height: number, anchorX?: number];

const crops: readonly Candidate[] = [
  ['exchange-south', 'district/exchange-south.png', 'architecture', 286, 220, 162],
  ['research-south', 'district/research-south.png', 'architecture', 284, 192, 131],
  ['disc-tree', 'district/disc-tree.png', 'flora', 49, 56],
  ['veinflora-planter', 'district/veinflora-planter.png', 'flora', 42, 38],
  ['roof-vent', 'district/roof-vent.png', 'architecture', 37, 25],
  ['market-stall', 'district/market-stall.png', 'furniture', 48, 43],
  ['sera-instrument', 'district/sera-instrument.png', 'object', 49, 49],
  ['sleeping-alcove', 'district/sleeping-alcove.png', 'furniture', 61, 52],
  ['domestic-terminal', 'district/domestic-terminal.png', 'furniture', 54, 43],
  ['wall-lamp', 'district/wall-lamp.png', 'object', 20, 24],
  ['ceramic-panel', 'district/ceramic-panel.png', 'architecture', 72, 33],
  ['service-hatch', 'district/service-hatch.png', 'architecture', 36, 31],
  ['observation-window', 'district/observation-window.png', 'architecture', 49, 40],
  ['conduit-elbow', 'district/conduit-elbow.png', 'architecture', 48, 35],
];

const reused: readonly Candidate[] = [
  ['contact-shadow', 'identity/contact-shadow.png', 'object', 32, 16],
  ['notice-board', 'identity/notice-board.png', 'furniture', 64, 64],
  ['plaza-bench', 'identity/plaza-bench.png', 'furniture', 64, 32],
  ['resonance-mark', 'identity/resonance-mark.png', 'object', 32, 32],
  ['lantern-plant', 'identity/lantern-plant.png', 'flora', 32, 64],
  ['exchange-counter', 'furniture/exchange-counter.png', 'furniture', 64, 32],
  ['work-bench', 'furniture/work-bench.png', 'furniture', 32, 32],
  ['bedside-cabinet', 'furniture/bedside-cabinet.png', 'furniture', 32, 32],
  ['paper-rack', 'furniture/paper-rack.png', 'furniture', 32, 32],
];

export const DISTRICT_ART: readonly (AssetRecord & { file: string; sourceScale: number })[] = [
  ...crops.map((candidate) => record(candidate, 1, 'Handover source crop')),
  ...reused.map((candidate) => record(candidate, 2, 'File-validated Pack 08B or Pack 10 runtime art')),
  record(['private-envelope', 'instrument/private-envelope.png', 'interface', 132, 97], 1, 'Pack 05 envelope extracted on PR #3'),
  record(['service-grille', 'district/service-grille.png', 'architecture', 16, 16], 2, 'ZA-DETAILS-01 vent-grille at its native source dimensions'),
];

function record([id, file, category, width, height, pivot]: Candidate, sourceScale: number, note: string) {
  return {
    id, file, category, width, height, sourceScale, note, status: 'temporary' as const,
    anchorX: pivot ?? width / 2,
    anchorY: id === 'contact-shadow' || id === 'resonance-mark' ? height / 2 : height,
  };
}
