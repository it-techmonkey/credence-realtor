/**
 * Fetch amenities for each project from Alnair look API and save to src/data/amenities.json.
 * Usage: node scripts/fetch-amenities.js [--limit N] [--delay MS]
 * Options:
 *   --limit N   Only process first N slugs (default: all)
 *   --delay MS  Delay between API calls in ms (default: 500)
 *
 * Requires: .env.local with ALNAIR_X_AUTH_TOKEN (or uses fallback from API route)
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const ALNAIR_LOOK_API = 'https://api.alnair.ae/project/look';
const X_AUTH_TOKEN = process.env.ALNAIR_X_AUTH_TOKEN || 'cf1ed55abb0afdff68ebc730e743b016a1d9560f9ecc40606a5c3f890c290a1c';
const X_APP_VERSION = '14.2.2';

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const delayIdx = args.indexOf('--delay');
const limit = limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : null;
const delayMs = delayIdx >= 0 && args[delayIdx + 1] ? parseInt(args[delayIdx + 1], 10) : 2000;

function extractAmenitiesFromDescription(description) {
  if (!description || typeof description !== 'string') return [];
  const text = description.trim();
  const results = [];
  const seen = new Set();
  const sectionRegex = /(?:Amenities|Features|Facilities|وسائل الراحة|المرافق|المميزات)\s*[:\-]\s*([\s\S]*?)(?=\n\n|\n#|\n\*{2,}|$)/gi;
  let m;
  while ((m = sectionRegex.exec(text)) !== null) {
    const block = m[1].trim();
    const parts = block.split(/\n|[,،]|\s+and\s+|\s+&\s+/gi).map((s) => s.replace(/^[\s\-*•·]\s*/, '').trim()).filter(Boolean);
    for (const p of parts) {
      const item = p.replace(/\s+/g, ' ').trim();
      if (item.length > 1 && item.length < 120 && !seen.has(item.toLowerCase())) {
        seen.add(item.toLowerCase());
        results.push(item);
      }
    }
  }
  const bulletRegex = /^[\s]*[\-*•·]\s+(.+)$/gm;
  while ((m = bulletRegex.exec(text)) !== null) {
    const item = m[1].trim().replace(/\s+/g, ' ');
    if (item.length > 1 && item.length < 120 && !seen.has(item.toLowerCase())) {
      seen.add(item.toLowerCase());
      results.push(item);
    }
  }
  return results;
}

async function fetchLook(slug) {
  const url = `${ALNAIR_LOOK_API}/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-AUTH-TOKEN': X_AUTH_TOKEN,
      'X-App-Version': X_APP_VERSION,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  return res.json();
}

function getAmenitiesFromLook(data) {
  let amenities = [];
  const raw = data.amenities ?? data.project_amenities ?? data.facilities ?? data.features;
  if (Array.isArray(raw) && raw.length > 0) {
    amenities = raw
      .map((a) => {
        if (typeof a === 'string' && a.trim()) return a.trim();
        if (a && typeof a === 'object' && a.name) return String(a.name).trim();
        if (a && typeof a === 'object' && a.title) return String(a.title).trim();
        return null;
      })
      .filter(Boolean);
  }
  if (amenities.length === 0 && data.description) {
    amenities = extractAmenitiesFromDescription(data.description);
  }
  return amenities;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'all_data.json');
  const outPath = path.join(__dirname, '..', 'src', 'data', 'amenities.json');

  if (!fs.existsSync(dataPath)) {
    console.error('all_data.json not found at', dataPath);
    process.exit(1);
  }

  const allData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const items = allData?.data?.items || [];
  const slugs = [...new Set(items.map((p) => p.slug).filter(Boolean))];
  const toProcess = limit ? slugs.slice(0, limit) : slugs;
  console.log(`Found ${slugs.length} unique slugs. Processing ${toProcess.length} (delay ${delayMs}ms between calls).`);

  const amenitiesMap = {};
  let done = 0;
  for (const slug of toProcess) {
    try {
      const data = await fetchLook(slug);
      if (data) {
        const amenities = getAmenitiesFromLook(data);
        if (amenities.length > 0) amenitiesMap[slug] = amenities;
      }
    } catch (e) {
      console.warn(`Failed ${slug}:`, e.message);
    }
    done++;
    if (done % 50 === 0) console.log(`Progress: ${done}/${toProcess.length}`);
    await sleep(delayMs);
  }

  fs.writeFileSync(outPath, JSON.stringify(amenitiesMap, null, 2), 'utf8');
  console.log(`Wrote ${Object.keys(amenitiesMap).length} project amenities to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
