/**
 * Filters all_data.json to UAE-only projects and writes all_data_uae.json.
 * Uses same logic as src/lib/staticPropertyData.ts: ALLOWED_CITY_IDS + UAE lat/lng bounds.
 * Run: node scripts/filter_uae_projects.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const INPUT_FILE = path.join(DATA_DIR, 'all_data.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'all_data_uae.json');

/** UAE city IDs — must match staticPropertyData.ts ALLOWED_CITY_IDS */
const ALLOWED_CITY_IDS = new Set([1, 2, 3, 5, 7, 14, 52]);

/** UAE bounding box */
const UAE_LAT_MIN = 22.16;
const UAE_LAT_MAX = 26.14;
const UAE_LNG_MIN = 51.0;
const UAE_LNG_MAX = 56.5;

function isLatLngInUAE(lat, lng) {
  if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number') return true;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return true;
  return lat >= UAE_LAT_MIN && lat <= UAE_LAT_MAX && lng >= UAE_LNG_MIN && lng <= UAE_LNG_MAX;
}

function isProjectInUAE(project) {
  const cid = project.city_id != null
    ? (typeof project.city_id === 'string' ? parseInt(project.city_id, 10) : project.city_id)
    : null;
  if (cid == null || isNaN(cid) || !ALLOWED_CITY_IDS.has(cid)) return false;
  const lat = project.latitude != null ? Number(project.latitude) : null;
  const lng = project.longitude != null ? Number(project.longitude) : null;
  return isLatLngInUAE(lat, lng);
}

function main() {
  console.log('Loading', INPUT_FILE, '...');
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(raw);
  const items = data?.data?.items;
  if (!Array.isArray(items)) {
    throw new Error('Expected data.data.items array');
  }
  const uaeItems = items.filter(isProjectInUAE);
  console.log('Total projects:', items.length);
  console.log('UAE projects:', uaeItems.length);
  const output = { data: { items: uaeItems } };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 0), 'utf8');
  console.log('Written:', OUTPUT_FILE);
}

main();
