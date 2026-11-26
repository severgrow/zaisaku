/** Runtime URLs for cropped Mineral Analog pieces. Full source sheets are not in this folder. */

export const publicAsset = (path: string): string => {
  if (typeof document === 'undefined') return path;
  return new URL(path, document.baseURI).href;
};

export const duelAsset = (file: string): string => publicAsset(`mineral/duel/${file}`);

export const catalogueAsset = (id: string): string => publicAsset(`mineral/catalogue/item-${id}.png`);
