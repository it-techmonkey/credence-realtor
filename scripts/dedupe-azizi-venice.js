/**
 * Dedupe Azizi Venice in all_data.json: keep only the single entry with slug "azizi-venice",
 * remove all "Azizi Venice 12", "Azizi Venice 13", etc.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/all_data.json');
const raw = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(raw);

const items = data?.data?.items || [];
if (!items.length) {
  console.error('No items in all_data.json');
  process.exit(1);
}

// Match "Azizi Venice" variants: slug is azizi-venice (with optional -N) or title is "Azizi Venice" or "Azizi Venice N"
function isAziziVeniceVariant(item) {
  const slug = (item.slug || '').toLowerCase();
  const title = (item.title || '').trim();
  if (slug === 'azizi-venice') return true;
  if (/^[a-f0-9]+-azizi-venice(-\d+)?$/.test(slug)) return true;
  if (/^Azizi Venice(\s+\d+)?$/i.test(title)) return true;
  return false;
}

const before = items.length;
const keptSlug = 'azizi-venice';
const filtered = items.filter((item) => {
  if (!isAziziVeniceVariant(item)) return true; // keep non–Azizi Venice
  return (item.slug || '').toLowerCase() === keptSlug; // keep only canonical one
});
const removed = before - filtered.length;

data.data.items = filtered;
fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), 'utf8');
console.log(`Deduped Azizi Venice: kept 1 entry (slug "${keptSlug}"), removed ${removed} duplicate(s). Total items: ${before} → ${filtered.length}`);
process.exit(0);
