/**
 * Build hotspots-distance.json from all_data_uae_en.json
 * Computes distance (km) from each property to:
 * - Dubai Mall: 25.197370022081568, 55.27972320239539
 * - Palm Jumeirah: 25.122538324435176, 55.13069276013228
 * - Dubai Airport: 25.25304319313163, 55.36793713040664
 * - Dubai Marina: 25.07785267911982, 55.13868211663433
 * - Al Maktoum International Airport: 24.886171239916422, 55.15869167895984
 *
 * Usage: node scripts/build-hotspots-distance.js
 * Output: src/data/hotspots-distance.json
 */

const fs = require('fs');
const path = require('path');

const HOTSPOTS = {
  dubai_mall: { lat: 25.197370022081568, lng: 55.27972320239539 },
  palm_jumeirah: { lat: 25.122538324435176, lng: 55.13069276013228 },
  dubai_airport: { lat: 25.25304319313163, lng: 55.36793713040664 },
  dubai_marina: { lat: 25.07785267911982, lng: 55.13868211663433 },
  al_maktoum_airport: { lat: 24.886171239916422, lng: 55.15869167895984 },
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

const dataPath = path.join(__dirname, '..', 'src', 'data', 'all_data_uae_en.json');
const outPath = path.join(__dirname, '..', 'src', 'data', 'hotspots-distance.json');

const raw = fs.readFileSync(dataPath, 'utf8');
const json = JSON.parse(raw);
const items = json?.data?.items || [];

const out = {};

for (const item of items) {
  const lat = item.latitude;
  const lng = item.longitude;
  if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number') continue;

  const key = (item.slug && String(item.slug).trim()) || `id_${item.id}`;
  out[key] = {
    dubai_mall_km: round2(haversineKm(lat, lng, HOTSPOTS.dubai_mall.lat, HOTSPOTS.dubai_mall.lng)),
    palm_jumeirah_km: round2(haversineKm(lat, lng, HOTSPOTS.palm_jumeirah.lat, HOTSPOTS.palm_jumeirah.lng)),
    dubai_airport_km: round2(haversineKm(lat, lng, HOTSPOTS.dubai_airport.lat, HOTSPOTS.dubai_airport.lng)),
    dubai_marina_km: round2(haversineKm(lat, lng, HOTSPOTS.dubai_marina.lat, HOTSPOTS.dubai_marina.lng)),
    al_maktoum_airport_km: round2(haversineKm(lat, lng, HOTSPOTS.al_maktoum_airport.lat, HOTSPOTS.al_maktoum_airport.lng)),
  };
}

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', Object.keys(out).length, 'entries to', outPath);
