import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ASSET_MANIFEST, readPngSize, validateManifest } from '../world/assets.js';
import { DISTRICT_ART } from '../world/district-art.js';
import { ARTWORK } from '../world/artwork.js';

const issues = validateManifest(ASSET_MANIFEST);
const keys = new Set<string>();
for (const link of ARTWORK) {
  if (keys.has(link.pixelKey)) issues.push(`${link.definitionId} reuses ${link.pixelKey}`);
  keys.add(link.pixelKey);
  if (!link.svgRef) issues.push(`${link.definitionId} has no svg fallback`);
}
const sums = new Map(readFileSync(new URL('../../art/packs/ZA-DISTRICT-01/SHA256SUMS', import.meta.url), 'utf8')
  .trim().split('\n').map((line) => { const [hash, file] = line.split('  '); return [file, hash]; }));
for (const record of DISTRICT_ART) {
  const file = new URL(`../../web/public/mineral/${record.file}`, import.meta.url);
  const bytes = readFileSync(file);
  const size = readPngSize(bytes);
  if (size?.width !== record.width * record.sourceScale || size.height !== record.height * record.sourceScale) issues.push(`${record.id}: PNG dimensions do not match the manifest`);
  if (createHash('sha256').update(bytes).digest('hex') !== sums.get(record.file)) issues.push(`${record.id}: missing or mismatched SHA-256`);
}
if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exit(1);
}
const temporary = ASSET_MANIFEST.filter((item) => item.status === 'temporary').length;
console.log(`Assets ok: ${ASSET_MANIFEST.length} records (${temporary} temporary), ${ARTWORK.length} object links.`);
