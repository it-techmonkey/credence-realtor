/**
 * Applies translation_cache.json to project data. Replaces any title/builder/district.title
 * that exactly matches a cache key with the cached English value.
 * Run: node scripts/apply_translation_cache.js [basename]
 *   Default: all_data_uae.json → all_data_uae_en.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'translation_cache.json');
const DATA_BASENAME = process.argv[2] && process.argv[2].trim() || 'all_data_uae';
const INPUT_FILE = path.join(DATA_DIR, `${DATA_BASENAME}.json`);
const OUTPUT_FILE = path.join(DATA_DIR, `${DATA_BASENAME}_en.json`);

const FIELDS_TO_TRANSLATE = ['title', 'builder', 'district.title'];

function getAt(obj, pathStr) {
  const parts = pathStr.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setAt(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null) cur[p] = {};
    cur = cur[p];
  }
  if (parts.length) cur[parts[parts.length - 1]] = value;
}

function applyCache(items, cache) {
  let replaced = 0;
  const out = items.map((item) => {
    const copy = JSON.parse(JSON.stringify(item));
    for (const field of FIELDS_TO_TRANSLATE) {
      const val = getAt(item, field);
      if (val != null && typeof val === 'string') {
        const key = val.trim();
        const translated = cache[key];
        if (translated !== undefined) {
          setAt(copy, field, translated);
          replaced++;
        }
      }
    }
    return copy;
  });
  return { items: out, replaced };
}

function main() {
  console.log('Loading cache:', CACHE_FILE);
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  const cacheKeys = Object.keys(cache);
  console.log('Cache entries:', cacheKeys.length);

  console.log('Loading data:', INPUT_FILE);
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(raw);
  const items = data?.data?.items;
  if (!Array.isArray(items)) {
    throw new Error('Expected data.data.items array');
  }
  console.log('Projects:', items.length);

  const { items: translatedItems, replaced } = applyCache(items, cache);
  console.log('Replacements made:', replaced);

  const output = { data: { items: translatedItems } };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 0), 'utf8');
  console.log('Written:', OUTPUT_FILE);
}

main();
