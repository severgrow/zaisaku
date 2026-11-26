/** Pack 04 catalogue plates that exist as individual PNGs. Definition ids, not new items. */

export const CATALOGUE_IDS: readonly string[] = [
  'blue-fault',
  'bone-dice',
  'closed-city',
  'counterfeit-seal',
  'cracked-saucer',
  'eclipse-monocle',
  'green-filter',
  'late-bell',
  'paper-charm',
  'prism-ticket',
  'second-mouth',
  'spare-key',
  'station-pendulum',
  'travellers-weight',
  'twin-left',
  'twin-right',
];

export const hasCatalogueArt = (id: string): boolean => CATALOGUE_IDS.includes(id);
