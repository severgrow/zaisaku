import { validateCatalogue } from '../engine/catalogue.js';
import { DEFINITIONS } from '../engine/definitions.js';

const issues = validateCatalogue(DEFINITIONS);
if (issues.length) {
  for (const issue of issues) console.error(`${issue.id} ${issue.field}: ${issue.message}`);
  process.exit(1);
}
console.log(`Catalogue ok: ${DEFINITIONS.length} objects.`);
