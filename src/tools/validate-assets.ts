import { ASSET_MANIFEST, validateManifest } from '../world/assets.js';
import { ARTWORK } from '../world/artwork.js';

const issues = validateManifest(ASSET_MANIFEST);
const keys = new Set<string>();
for (const link of ARTWORK) {
  if (keys.has(link.pixelKey)) issues.push(`${link.definitionId} reuses ${link.pixelKey}`);
  keys.add(link.pixelKey);
  if (!link.svgRef) issues.push(`${link.definitionId} has no svg fallback`);
}
if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exit(1);
}
const temporary = ASSET_MANIFEST.filter((item) => item.status === 'temporary').length;
console.log(`Assets ok: ${ASSET_MANIFEST.length} records (${temporary} temporary), ${ARTWORK.length} object links.`);
