/**
 * Backfill project-amenities.json from descriptions.json for all slugs that have
 * a description but no amenities entry. Uses keyword extraction (same logic as
 * descriptionParser extractAmenities). Preserves existing project-amenities entries.
 *
 * Usage: node scripts/build-project-amenities-from-descriptions.js
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const ALL_DATA_PATH = path.join(ROOT, 'src/data/all_data_uae_en.json');
const DESCRIPTIONS_PATH = path.join(ROOT, 'src/data/descriptions.json');
const PROJECT_AMENITIES_PATH = path.join(ROOT, 'src/data/project-amenities.json');
const AMENITY_ENUMS_PATH = path.join(ROOT, 'src/data/amenity-enums.json');

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Align with src/lib/descriptionParser/types.ts (AMENITY_KEYWORD_MAP + AMENITY_KEY_TO_ENUM_ID)
const KEYWORD_TO_ENUM = {
  pool: 'swimming_pool',
  gym: 'gym',
  yoga_space: 'yoga_wellness',
  spa: 'spa_area',
  sauna: 'spa_area',
  steam_room: 'spa_area',
  jacuzzi: 'jacuzzi',
  bbq_area: 'bbq_area',
  cinema: 'cinema',
  kids_play_area: 'kids_play_area',
  garden: 'garden',
  zen_garden: 'garden',
  co_working: 'co_working',
  lounge: 'cafe_restro',
  parking: 'parking',
  ev_charging: 'ev_charging',
  concierge: 'concierge',
  restaurant: 'cafe_restro',
  retail_shops: 'malls_nearby',
  smart_home: 'smart_home_system',
  running_track: 'running_track',
  rooftop: 'rooftop',
  beach_access: 'beach_access',
  marina: 'marina',
  padel_court: 'padel_court',
  kids_pool: 'kids_pool',
  furniture_packages: 'furniture_packages',
  proximity_medical: 'proximity_medical',
  close_to_airport: 'close_to_airport',
  party_hall: 'party_hall',
};

const KEYWORDS_BY_KEY = {
  pool: ['pool', 'swimming pool', 'infinity pool', 'lap pool', 'rooftop pool'],
  gym: ['gym', 'fitness center', 'fitness studio', 'fitness area'],
  yoga_space: ['yoga', 'meditation', 'zumba'],
  spa: ['spa', 'wellness', 'hammam'],
  sauna: ['sauna'],
  steam_room: ['steam room'],
  jacuzzi: ['jacuzzi'],
  bbq_area: ['bbq', 'barbecue'],
  cinema: ['cinema', 'private cinema', 'movie'],
  kids_play_area: ['kids play', 'playground', 'children', "children's", 'kids pool', 'kids area'],
  garden: ['garden', 'landscaped', 'lawn', 'pavilion'],
  zen_garden: ['zen garden', 'japanese garden'],
  co_working: ['co-working', 'coworking'],
  lounge: ['lounge', 'lobby'],
  parking: ['parking'],
  ev_charging: ['ev charging', 'electric car', 'car charging'],
  concierge: ['concierge', '24/7', 'serviced lobby'],
  restaurant: ['restaurant', 'cafe', 'cafes'],
  retail_shops: ['retail', 'shops', 'shopping', 'mall', 'supermarket'],
  smart_home: ['smart home', 'smart key', 'fingerprint', 'smart key system'],
  running_track: ['running track', 'jogging', 'walking track'],
  rooftop: ['rooftop', 'roof terrace'],
  beach_access: ['beach', 'beach access'],
  marina: ['marina', 'waterfront'],
  padel_court: ['padel', 'padel court'],
  kids_pool: ['kids pool', "kids' pool", 'children pool'],
  furniture_packages: ['furniture', 'furnished', 'furnishing'],
  proximity_medical: ['medical', 'hospital', 'clinic', 'proximity to medical'],
  close_to_airport: ['airport', 'close to airport'],
  party_hall: ['party', 'event hall', 'party hall', 'event space'],
};

function extractAmenityIds(plainText) {
  if (!plainText || typeof plainText !== 'string') return [];
  const lower = plainText.toLowerCase();
  const seen = new Set();
  for (const [key, keywords] of Object.entries(KEYWORDS_BY_KEY)) {
    const matched = keywords.some((kw) => lower.includes(kw));
    if (matched) {
      const enumId = KEYWORD_TO_ENUM[key];
      if (enumId && !seen.has(enumId)) seen.add(enumId);
    }
  }
  return Array.from(seen);
}

function main() {
  const allData = JSON.parse(fs.readFileSync(ALL_DATA_PATH, 'utf8'));
  const descriptions = JSON.parse(fs.readFileSync(DESCRIPTIONS_PATH, 'utf8'));
  const amenityEnums = JSON.parse(fs.readFileSync(AMENITY_ENUMS_PATH, 'utf8'));
  const validEnumIds = new Set(Object.keys(amenityEnums));

  let projectAmenities = {};
  try {
    projectAmenities = JSON.parse(fs.readFileSync(PROJECT_AMENITIES_PATH, 'utf8'));
  } catch {
    projectAmenities = {};
  }

  const items = allData?.data?.items || [];
  const slugs = [...new Set(items.map((p) => p.slug).filter(Boolean))];
  let added = 0;
  for (const slug of slugs) {
    if (projectAmenities[slug] && Array.isArray(projectAmenities[slug]) && projectAmenities[slug].length > 0) {
      continue;
    }
    const rawDesc = descriptions[slug];
    if (typeof rawDesc !== 'string' || rawDesc.trim().length < 50) continue;
    const plain = stripHtml(rawDesc);
    if (!plain.trim()) continue;
    const extracted = extractAmenityIds(plain);
    const filtered = extracted.filter((id) => validEnumIds.has(id));
    if (filtered.length > 0) {
      projectAmenities[slug] = filtered;
      added++;
    }
  }

  fs.writeFileSync(PROJECT_AMENITIES_PATH, JSON.stringify(projectAmenities, null, 2), 'utf8');
  console.log(`Done. Added amenities for ${added} slugs. Total entries in project-amenities.json: ${Object.keys(projectAmenities).length}`);
}

main();
