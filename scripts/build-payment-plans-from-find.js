/**
 * Build payment-plans.json by fetching projects in pages from Alnair /project/find
 * (instead of 1300+ /project/look/[slug] calls). Reduces requests to ~40 paginated calls.
 *
 * Usage: node scripts/build-payment-plans-from-find.js
 *
 * Output: src/data/payment-plans.json → { "slug": { payment_plans: [...] } }
 * Only includes projects whose slug exists in all_data_uae_en.json.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const FIND_API = 'https://api.alnair.ae/project/find';
const LIMIT = 30;
const DELAY_MS = 500;

const SEARCH_AREA = {
  east: 55.529708862304695,
  north: 25.19375777608886,
  south: 25.114201938326083,
  west: 54.99275207519532,
};

const COOKIE = process.env.ALNAIR_CF_CLEARANCE_COOKIE || process.env.ALNAIR_COOKIE || '';

function getHeaders() {
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };
  if (COOKIE && COOKIE.trim()) headers['Cookie'] = COOKIE.trim();
  return headers;
}

function buildUrl(page) {
  const url = new URL(FIND_API);
  url.searchParams.set('limit', String(LIMIT));
  url.searchParams.set('page', String(page));
  url.searchParams.set('city_id', '1');
  url.searchParams.set('search_area[east]', String(SEARCH_AREA.east));
  url.searchParams.set('search_area[north]', String(SEARCH_AREA.north));
  url.searchParams.set('search_area[south]', String(SEARCH_AREA.south));
  url.searchParams.set('search_area[west]', String(SEARCH_AREA.west));
  url.searchParams.set('has_cluster', '1');
  url.searchParams.set('has_boundary', '0');
  url.searchParams.set('zoom', '11');
  return url.toString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(page) {
  const url = buildUrl(page);
  const res = await fetch(url, { method: 'GET', headers: getHeaders() });
  if (res.status === 429) return { ok: false, status: 429, rateLimited: true, data: null };
  if (!res.ok) return { ok: false, status: res.status, data: null };
  const data = await res.json();
  return { ok: true, status: res.status, data };
}

function getSlugsFromUaeData() {
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'all_data_uae_en.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('all_data_uae_en.json not found at ' + dataPath);
  }
  const json = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const items = json?.data?.items || [];
  const slugs = new Set(items.map((p) => p.slug).filter(Boolean));
  return slugs;
}

function getLastPage(data) {
  const meta = data?.data?.meta ?? data?.meta ?? null;
  if (meta && typeof meta.last_page === 'number') return meta.last_page;
  if (meta && typeof meta.total_pages === 'number') return meta.total_pages;
  const items = data?.data?.items ?? data?.items ?? [];
  if (Array.isArray(items) && items.length < LIMIT) return 1;
  return null;
}

function main() {
  const uaeSlugs = getSlugsFromUaeData();
  console.log('Slugs in all_data_uae_en.json:', uaeSlugs.size);

  const outPath = path.join(__dirname, '..', 'src', 'data', 'payment-plans.json');
  const paymentPlansMap = {};

  return (async () => {
    let page = 1;
    let lastPage = null;

    while (true) {
      const result = await fetchPage(page);

      if (!result.ok) {
        if (result.rateLimited) {
          console.warn(`Page ${page}: Rate limited (429). Waiting 60s...`);
          await sleep(60000);
          continue;
        }
        console.error(`Page ${page}: API returned ${result.status}. Stopping.`);
        if (page === 1 && (result.status === 403 || result.status === 401)) {
          console.log('Tip: Set ALNAIR_CF_CLEARANCE_COOKIE in .env.local if you get 403.');
        }
        break;
      }

      const data = result.data;
      if (lastPage === null) lastPage = getLastPage(data);
      const items = data?.data?.items ?? data?.items ?? [];
      const currentPage = data?.data?.meta?.current_page ?? data?.meta?.current_page ?? page;

      if (lastPage !== null) {
        console.log(`Fetching page ${currentPage}/${lastPage}`);
      } else {
        console.log(`Fetching page ${currentPage}`);
      }

      for (const project of items) {
        const slug = project.slug;
        if (!slug || typeof slug !== 'string') continue;
        if (!uaeSlugs.has(slug)) continue;

        const plans = project.payment_plans ?? project.data?.payment_plans ?? null;
        if (!Array.isArray(plans) || plans.length === 0) continue;

        paymentPlansMap[slug] = { payment_plans: plans };
      }

      if (Array.isArray(items) && items.length < LIMIT) break;
      if (lastPage !== null && page >= lastPage) break;

      page++;
      await sleep(DELAY_MS);
    }

    fs.writeFileSync(outPath, JSON.stringify(paymentPlansMap, null, 2), 'utf8');
    console.log('Wrote', Object.keys(paymentPlansMap).length, 'slugs with payment plans to', outPath);
  })();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
