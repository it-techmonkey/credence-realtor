/**
 * Offline translation of projects JSON → same file name with _en suffix.
 * Uses translation_cache.json to avoid re-translating. Unique strings only, 1500ms rate limit, 3 retries.
 * Run: node scripts/translate_projects.js [basename]
 *   No arg: all_data.json → all_data_en.json
 *   all_data_uae: all_data_uae.json → all_data_uae_en.json
 *
 * Uses google-translate-api-x (already in project).
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'translation_cache.json');
// Optional first arg: base name without .json (e.g. "all_data_uae") → reads all_data_uae.json, writes all_data_uae_en.json
const DATA_BASENAME = process.argv[2] && process.argv[2].trim() || 'all_data';
const INPUT_FILE = path.join(DATA_DIR, `${DATA_BASENAME}.json`);
const OUTPUT_FILE = path.join(DATA_DIR, `${DATA_BASENAME}_en.json`);
const RATE_MS = 1500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const ARABIC_OR_URDU = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
function needsTranslation(str) {
  return typeof str === 'string' && str.trim() !== '' && ARABIC_OR_URDU.test(str);
}

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

const FIELDS_TO_TRANSLATE = ['title', 'builder', 'district.title'];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateWithRetry(translate, text, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await translate(text, { to: 'en', client: 'gtx' });
      const out = res && typeof res === 'object' && 'text' in res ? res.text : '';
      return (out && out.trim()) || text;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  Retry ${attempt}/${retries} after error:`, err.message);
      await sleep(RETRY_DELAY_MS);
    }
  }
  return text;
}

function loadCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const data = JSON.parse(raw);
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 0), 'utf8');
}

function collectUniqueStrings(items) {
  const set = new Set();
  for (const item of items) {
    for (const field of FIELDS_TO_TRANSLATE) {
      const val = getAt(item, field);
      if (needsTranslation(val)) set.add(String(val).trim());
    }
  }
  return Array.from(set);
}

function applyTranslations(items, cache) {
  const out = [];
  const total = items.length;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const copy = JSON.parse(JSON.stringify(item));
    for (const field of FIELDS_TO_TRANSLATE) {
      const val = getAt(item, field);
      if (needsTranslation(val)) {
        const key = String(val).trim();
        const translated = cache[key];
        if (translated !== undefined) setAt(copy, field, translated);
      }
    }
    out.push(copy);
    if ((i + 1) % 50 === 0 || i === items.length - 1) {
      console.log(`Building project ${i + 1} / ${total}`);
    }
  }
  return out;
}

async function main() {
  console.log('Loading', INPUT_FILE, '...');
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(raw);
  const items = data?.data?.items;
  if (!Array.isArray(items)) {
    throw new Error('Expected data.data.items array');
  }
  const totalProjects = items.length;
  console.log('Projects:', totalProjects);

  const uniqueStrings = collectUniqueStrings(items);
  console.log('Unique strings to translate:', uniqueStrings.length);

  let cache = loadCache();
  console.log('Cache entries loaded:', Object.keys(cache).length);

  const translate = require('google-translate-api-x');
  const toTranslate = uniqueStrings.filter((s) => cache[s] === undefined);
  console.log('New strings to fetch:', toTranslate.length);

  for (let i = 0; i < toTranslate.length; i++) {
    const text = toTranslate[i];
    try {
      const translated = await translateWithRetry(translate, text);
      cache[text] = translated;
      if ((i + 1) % 10 === 0) saveCache(cache);
    } catch (err) {
      console.error(`Failed to translate after ${MAX_RETRIES} retries:`, text.slice(0, 50), err.message);
      cache[text] = text;
    }
    console.log(`Translating string ${i + 1} / ${toTranslate.length}`);
    if (i < toTranslate.length - 1) await sleep(RATE_MS);
  }

  saveCache(cache);
  console.log('Building translated projects...');

  const translatedItems = applyTranslations(items, cache);
  const output = { data: { items: translatedItems } };

  console.log('Writing', OUTPUT_FILE, '...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 0), 'utf8');
  console.log('Done. Output:', OUTPUT_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
