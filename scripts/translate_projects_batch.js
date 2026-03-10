/**
 * Batch translation for projects JSON. Uses MyMemory API (no rate limit issues like Google).
 * One request per string with delay between requests; results cached.
 *
 * Run: node scripts/translate_projects_batch.js [basename]
 *   No arg: all_data.json → all_data_en.json
 *   all_data_uae: all_data_uae.json → all_data_uae_en.json
 *
 * Optional: GOOGLE_FIRST=1 to try Google batch first, fallback to MyMemory on 429.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'translation_cache.json');
const DATA_BASENAME = process.argv[2] && process.argv[2].trim() || 'all_data';
const INPUT_FILE = path.join(DATA_DIR, `${DATA_BASENAME}.json`);
const OUTPUT_FILE = path.join(DATA_DIR, `${DATA_BASENAME}_en.json`);

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MYMEMORY_DELAY_MS = 400;
const GOOGLE_BATCH_SIZE = 20;
const GOOGLE_DELAY_BETWEEN_BATCHES_MS = 15000;
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
    if ((i + 1) % 100 === 0 || i === items.length - 1) {
      console.log(`Building project ${i + 1} / ${total}`);
    }
  }
  return out;
}

/** MyMemory: one string, Arabic → English. */
async function translateWithMyMemory(text) {
  const params = new URLSearchParams({ q: text, langpair: 'ar|en' });
  const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  return (translated && translated.trim()) || text;
}

/** Translate one string via MyMemory with retries and delay. */
async function translateOneMyMemory(text, cache) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const out = await translateWithMyMemory(text);
      return out;
    } catch (err) {
      if (attempt === MAX_RETRIES) return text;
      await sleep(RETRY_DELAY_MS);
    }
  }
  return text;
}

/** Google batch (may 429). Returns map of text -> translated or null on failure. */
async function translateBatchGoogle(translate, batch) {
  const results = await translate(batch, {
    to: 'en',
    client: 'gtx',
    rejectOnPartialFail: false,
  });
  const out = {};
  batch.forEach((text, i) => {
    const r = results && results[i];
    const translated = r && typeof r === 'object' && r.text != null ? String(r.text).trim() : '';
    out[text] = translated || text;
  });
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
  console.log('Unique strings (total):', uniqueStrings.length);

  let cache = loadCache();
  console.log('Cache entries loaded:', Object.keys(cache).length);

  let toTranslate = uniqueStrings.filter((s) => cache[s] === undefined);
  console.log('New strings to fetch:', toTranslate.length);

  const useGoogleFirst = process.env.GOOGLE_FIRST === '1';

  if (toTranslate.length > 0 && useGoogleFirst) {
    const translate = require('google-translate-api-x');
    const numBatches = Math.ceil(toTranslate.length / GOOGLE_BATCH_SIZE);
    console.log(`Trying Google first: batch size ${GOOGLE_BATCH_SIZE}, delay ${GOOGLE_DELAY_BETWEEN_BATCHES_MS}ms`);
    let googleFailed = false;
    for (let b = 0; b < numBatches && !googleFailed; b++) {
      const start = b * GOOGLE_BATCH_SIZE;
      const batch = toTranslate.slice(start, start + GOOGLE_BATCH_SIZE);
      try {
        const batchResults = await translateBatchGoogle(translate, batch);
        Object.assign(cache, batchResults);
        if ((b + 1) % 3 === 0 || b === numBatches - 1) saveCache(cache);
      } catch (err) {
        console.warn('Google rate limited or error, switching to MyMemory for remaining:', err.message);
        toTranslate = uniqueStrings.filter((s) => cache[s] === undefined);
        googleFailed = true;
        break;
      }
      console.log(`Google batch ${b + 1} / ${numBatches}`);
      if (b < numBatches - 1) await sleep(GOOGLE_DELAY_BETWEEN_BATCHES_MS);
    }
    toTranslate = uniqueStrings.filter((s) => cache[s] === undefined);
  }

  if (toTranslate.length > 0) {
    console.log(`Using MyMemory (${toTranslate.length} strings, ~${MYMEMORY_DELAY_MS}ms delay between requests).`);
    for (let i = 0; i < toTranslate.length; i++) {
      const text = toTranslate[i];
      cache[text] = await translateOneMyMemory(text, cache);
      if ((i + 1) % 25 === 0 || i === toTranslate.length - 1) saveCache(cache);
      if ((i + 1) % 50 === 0 || i === toTranslate.length - 1) {
        console.log(`Translating string ${i + 1} / ${toTranslate.length}`);
      }
      if (i < toTranslate.length - 1) await sleep(MYMEMORY_DELAY_MS);
    }
    saveCache(cache);
  } else {
    console.log('Nothing to translate; using cache only.');
  }

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
