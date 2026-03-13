import { NextRequest, NextResponse } from 'next/server';
import allDataJson from '@/data/all_data_uae_en.json';
import categoriesConfig from '@/data/propertyCategories.config.json';
import officeSlugs from '@/data/office-slugs.json';
import commercialSlugs from '@/data/commercial-slugs.json';
import {
  isProjectInAllowedCities,
  getCityName,
  getCityIdFromParam,
  getProjectType,
  getMainImage,
  hasStoredDescription,
  descriptionContainsWaterfrontOrLagoon,
} from '@/lib/staticPropertyData';

const AFFORDABLE_MAX = (categoriesConfig as { affordableMaxPriceAED?: number }).affordableMaxPriceAED ?? 1_500_000;
const LUXURY_DEV_NAMES = (categoriesConfig as { luxuryDeveloperNames?: string[] }).luxuryDeveloperNames ?? [];
/** Luxury = developers whose minimum project price (starting point) is 5M+ AED */
const LUXURY_MIN_PRICE_AED = 5_000_000;
const OFFICE_SET = new Set((officeSlugs as string[]).map((s) => s.toLowerCase().trim()));
const COMMERCIAL_SET = new Set((commercialSlugs as string[]).map((s) => s.toLowerCase().trim()));

const OFFICE_KEYWORDS = ['office', 'offices', 'مكتب', 'مكاتب', 'business bay', 'difc'];
const COMMERCIAL_KEYWORDS = ['commercial', 'retail', 'تجاري', 'تجارة', 'mall'];

/** Normalize developer/builder for comparison: lowercase, drop common suffixes. */
function normalizeDeveloperName(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+(properties|development|group|holding|holdings|llc|llc\.?)$/i, '')
    .trim();
}

/**
 * Builder strings as they appear in all_data.json (Arabic/Urdu/English) per developer.
 * Search by these names so filter works without relying on translation.
 */
const BUILDERS_BY_DEVELOPER: Record<string, string[]> = {
  emaar: ['إمار', 'امار', 'emaar', 'Emaar', 'Emaar Properties'],
  nakheel: ['نخيلهيل', 'نخيل', 'nakheel', 'Nakheel'],
  meraas: ['مراس', 'ميراس', 'meraas', 'Meraas'],
  'dubai properties': ['مجموعة دبي للعقارات', 'دبي الجنوب للعقارات دي دبليو سي ش.ذ.م.م', 'دبي الجنوب', 'مجموعة دبي', 'Dubai Properties'],
  damac: ['داماك', 'damac', 'Damac', 'DAMAC'],
  sobha: ['سوبها', 'سوبا', 'sobha', 'Sobha', 'SOBHA'],
  aldar: ['الدار', 'aldar', 'Aldar', 'ALDAR'],
  azizi: ['عزيزي', 'azizi', 'Azizi', 'AZIZI'],
  ellington: ['إلينغتون', 'الينغتون', 'ellington', 'Ellington'],
  'majid al futtaim': ['ماجد للتطوير', 'ماجد الفطيم', 'ماجد', 'Majid Al Futtaim', 'majid al futtaim'],
  binghatti: ['بينغهاتي', 'binghatti', 'Binghatti', 'bingati'],
  imtiaz: ['ايمتياز', 'امتياز', 'imtiaz', 'Imtiaz', 'imtiyaz'],
  omniyat: ['أومنيات', 'omniyat', 'Omniyat'],
  'hre development': ['HRE Development', 'HRE', 'hre development'],
  arada: ['arada', 'ARADA', 'Arada'],
  beyond: ['beyond', 'Beyond'],
  danube: ['danube', 'Danube'],
  'dubai south': ['Dubai South', 'dubai south'],
  'expo city': ['Expo City', 'expo city'],
  reportage: ['reportage', 'Reportage'],
  'select group': ['Select Group', 'select group'],
  'union properties': ['Union Properties', 'union properties'],
  nabni: ['nabni', 'Nabni'],
};

/** Normalize Arabic/Urdu for fuzzy match: collapse alef/ya variants so إمار and امار both match. */
function normalizeArabicForMatch(s: string): string {
  return (s || '')
    .trim()
    .replace(/\u0640/g, '')
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064a')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getBuilderAliasesForDeveloper(developerParam: string): string[] {
  const paramNorm = normalizeDeveloperName(developerParam);
  const firstWord = paramNorm.split(/\s+/)[0] || paramNorm;
  const list = BUILDERS_BY_DEVELOPER[paramNorm] ?? BUILDERS_BY_DEVELOPER[firstWord] ?? [];
  return list.map((b) => b.trim()).filter(Boolean);
}

/** Match filter param against builder: exact/alias list (Urdu/Arabic/English) OR translated name. */
function developerFilterMatches(
  developerParam: string,
  rawBuilder: string,
  translatedBuilder: string
): boolean {
  if (!rawBuilder || typeof rawBuilder !== 'string') return false;
  const b = rawBuilder.trim();
  if (!b) return false;
  const paramNorm = normalizeDeveloperName(developerParam);
  const aliases = getBuilderAliasesForDeveloper(developerParam);
  const bNorm = normalizeArabicForMatch(b);
  if (aliases.length > 0) {
    for (const alias of aliases) {
      if (b === alias || b.includes(alias) || alias.includes(b)) return true;
      if (bNorm && normalizeArabicForMatch(alias) && (bNorm.includes(normalizeArabicForMatch(alias)) || normalizeArabicForMatch(alias).includes(bNorm))) return true;
    }
  }
  const displayNorm = normalizeDeveloperName(translatedBuilder || b);
  if (!displayNorm || !paramNorm) return false;
  const paramFirst = paramNorm.split(/\s+/)[0] || paramNorm;
  const displayFirst = displayNorm.split(/\s+/)[0] || displayNorm;
  return (
    displayNorm.includes(paramNorm) ||
    paramNorm.includes(displayNorm) ||
    displayNorm.includes(paramFirst) ||
    paramNorm.includes(displayFirst)
  );
}

/**
 * Unit type codes: statistics.units / .villas / .transactions use these keys.
 * 110=Studio(0), 111=1BR, 112=2BR, 113=3BR, 114=4BR, 115=5BR, 116=6BR, 117=7BR.
 * 164=penthouse (count as 0 for min filter), 462=villa (count as 2 for safety).
 */
const UNIT_CODE_TO_BEDROOMS: Record<string, number> = {
  '110': 0, '111': 1, '112': 2, '113': 3, '114': 4, '115': 5, '116': 6, '117': 7,
  '164': 0, '462': 2,
};

/** Returns max bedroom count from statistics (units, villas, or transactions). So "1 Bedroom" = show projects with max >= 1. */
function getProjectBedrooms(project: any): number {
  let maxBedrooms = 0;
  const consider = (obj: Record<string, unknown> | null | undefined) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const br = UNIT_CODE_TO_BEDROOMS[key];
      if (br !== undefined && br > maxBedrooms) maxBedrooms = br;
    }
  };
  consider(project?.statistics?.units);
  consider(project?.statistics?.villas);
  consider(project?.statistics?.transactions);
  return maxBedrooms;
}

/** Returns true if project has at least one unit type with this many bedrooms (for exact "1 BR only" style filter). */
function projectHasBedroomOption(project: any, minBedrooms: number): boolean {
  if (minBedrooms < 0) return true;
  const consider = (obj: Record<string, unknown> | null | undefined) => {
    if (!obj || typeof obj !== 'object') return false;
    for (const key of Object.keys(obj)) {
      const br = UNIT_CODE_TO_BEDROOMS[key];
      if (br !== undefined && br >= minBedrooms) return true;
    }
    return false;
  };
  return consider(project?.statistics?.units) || consider(project?.statistics?.villas) || consider(project?.statistics?.transactions);
}

function textContainsAny(text: string, keywords: string[]): boolean {
  const t = (text || '').toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

function projectSlugTitleDistrict(project: any): string {
  const s = (project.slug || '').toString().toLowerCase();
  const t = (project.title || '').toString().toLowerCase();
  const d = (project.district?.title || project.district || '').toString().toLowerCase();
  return `${s} ${t} ${d}`;
}

function getProjectCategory(project: any): string {
  const slug = (project.slug || '').toString().toLowerCase().trim();
  const combined = projectSlugTitleDistrict(project);
  const builder = (project.builder || '').toString();
  const priceFrom = project.statistics?.total?.price_from ?? project.statistics?.total?.price_to ?? 0;

  if (OFFICE_SET.has(slug)) return 'Office';
  if (textContainsAny(combined, OFFICE_KEYWORDS)) return 'Office';
  if (COMMERCIAL_SET.has(slug)) return 'Commercial';
  if (textContainsAny(combined, COMMERCIAL_KEYWORDS)) return 'Commercial';
  // Waterfront: only projects whose stored description contains "waterfront" or "lagoon"
  if (descriptionContainsWaterfrontOrLagoon(project.slug)) return 'Waterfront';
  // Luxury: developers whose starting point (min price across their projects) is 5M+; fallback to name list for any edge cases
  // (getProjectCategory is called before we have the luxury builder set; category filter uses the set computed in GET)
  const isLuxuryByName = LUXURY_DEV_NAMES.some((name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name));
  if (isLuxuryByName) return 'Luxury';
  if (priceFrom > 0 && priceFrom <= AFFORDABLE_MAX) return 'Affordable';
  return 'Off-Plan';
}

function transformProject(project: any) {
  const stats = project.statistics?.total || {};
  const minPrice = stats.price_from || 0;
  const maxPrice = stats.price_to || 0;
  const photos = Array.isArray(project.photos) ? project.photos : [];
  const mainImage = getMainImage(project);
  const gallery = photos
    .map((p: any) => (typeof p === 'string' ? p : (p?.src || p?.logo)))
    .filter((src: string) => src && src !== mainImage);

  let readyDate = project.construction_inspection_date;
  if (readyDate && typeof readyDate === 'string') {
    const match = readyDate.match(/(\d{4})-(\d{2})/);
    if (match) readyDate = `Q${Math.ceil(parseInt(match[2], 10) / 3)} ${match[1]}`;
  }

  const category = (project as any)._category !== undefined ? (project as any)._category : getProjectCategory(project);
  const cityId = project.city_id;
  const lat = project.latitude;
  const lng = project.longitude;
  const bedrooms = getProjectBedrooms(project);

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    type: getProjectType(project),
    category,
    price: minPrice || maxPrice,
    minPrice,
    maxPrice,
    mainImage: mainImage ?? null,
    gallery,
    location: (project.district?.title || project.district || '') || '',
    locality: (project.district?.title || project.district || '') || '',
    city: getCityName(cityId),
    developer: project.builder || '',
    readyDate: readyDate || null,
    latitude: lat != null && !isNaN(Number(lat)) ? Number(lat) : null,
    longitude: lng != null && !isNaN(Number(lng)) ? Number(lng) : null,
    bedrooms,
  };
}

/** Normalize type query: "ready" | "off-plan" | "off plan" */
function normalizeTypeParam(typeParam: string | null): 'Ready' | 'Off-Plan' | null {
  if (!typeParam || typeof typeParam !== 'string') return null;
  const t = typeParam.trim().toLowerCase().replace(/\s+/g, '-');
  if (t === 'ready') return 'Ready';
  if (t === 'off-plan' || t === 'offplan') return 'Off-Plan';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '9', 10)));
    const cityParam = searchParams.get('city')?.trim();
    const typeParam = searchParams.get('type')?.trim();
    const locality = searchParams.get('locality')?.trim().toLowerCase();
    const search = searchParams.get('search')?.trim().toLowerCase();
    const developer = searchParams.get('developer')?.trim().toLowerCase();
    const category = searchParams.get('category')?.trim();
    const bedroomsParam = searchParams.get('bedrooms');
    const minBedroomsNum = bedroomsParam ? parseInt(bedroomsParam, 10) : NaN;
    const minBedrooms = Number.isNaN(minBedroomsNum) || minBedroomsNum < 0 ? undefined : minBedroomsNum;
    const unitTypeParam = searchParams.get('unitType')?.trim().toLowerCase();
    const unitType = unitTypeParam === 'apartment' || unitTypeParam === 'villa' ? unitTypeParam : undefined;
    let minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    let maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

    if (category && category.toLowerCase() === 'affordable') {
      const cap = AFFORDABLE_MAX;
      maxPrice = maxPrice !== undefined && maxPrice > 0 ? Math.min(maxPrice, cap) : cap;
    }

    let items: any[] = (allDataJson as any)?.data?.items || [];

    // 1. Only allowed cities (1,2,3,5,7,14,52); if coords present they must be in UAE
    items = items.filter((p: any) => isProjectInAllowedCities(p));

    // 2. Remove 0 AED (price_from === 0 && price_to === 0)
    items = items.filter((p: any) => {
      const from = p.statistics?.total?.price_from ?? 0;
      const to = p.statistics?.total?.price_to ?? 0;
      return from > 0 || to > 0;
    });

    // 2b. Only show properties that have a stored description
    items = items.filter((p: any) => hasStoredDescription(p.slug));

    // 2c. Build set of developers (builders) whose starting point is 5M+ (min price across all their projects)
    const builderMinPrice = new Map<string, number>();
    for (const p of items) {
      const b = (p.builder || '').toString().trim();
      if (!b) continue;
      const priceFrom = p.statistics?.total?.price_from ?? 0;
      if (priceFrom <= 0) continue;
      const current = builderMinPrice.get(b);
      if (current === undefined) builderMinPrice.set(b, priceFrom);
      else builderMinPrice.set(b, Math.min(current, priceFrom));
    }
    const luxuryBuilders5M = new Set<string>();
    builderMinPrice.forEach((minP, builder) => {
      if (minP >= LUXURY_MIN_PRICE_AED) luxuryBuilders5M.add(builder);
    });

    // 3. City filter (by city_id in data — for UI filter; location still determined by lat/long)
    const filterCityId = getCityIdFromParam(cityParam ?? undefined);
    if (filterCityId !== null) {
      items = items.filter((p: any) => {
        const cid = p.city_id != null ? (typeof p.city_id === 'string' ? parseInt(p.city_id, 10) : p.city_id) : null;
        return cid === filterCityId;
      });
    }

    // 4. Type filter (ready / off-plan)
    const filterType = normalizeTypeParam(typeParam ?? null);
    if (filterType !== null) {
      items = items.filter((p: any) => getProjectType(p) === filterType);
    }

    // 5. Remaining filters: category, locality, search, developer, minPrice, maxPrice
    if (category && category !== 'All') {
      const cat = category.toLowerCase();
      if (cat === 'luxury') {
        items = items.filter((p: any) => {
          const builder = (p.builder || '').toString().trim();
          const isLuxury5M = luxuryBuilders5M.has(builder);
          (p as any)._category = 'Luxury';
          return isLuxury5M;
        });
      } else {
        items = items.filter((p: any) => {
          const projectCat = getProjectCategory(p);
          (p as any)._category = projectCat;
          return projectCat.toLowerCase() === cat;
        });
      }
    }

    if (locality) {
      items = items.filter(
        (p: any) =>
          p.district?.title?.toLowerCase().includes(locality) ||
          p.district?.title?.toLowerCase() === locality
      );
    }

    if (search) {
      items = items.filter(
        (p: any) =>
          (p.slug && (p.slug as string).toLowerCase().includes(search)) ||
          p.title?.toLowerCase().includes(search) ||
          p.builder?.toLowerCase().includes(search) ||
          p.district?.title?.toLowerCase().includes(search)
      );
    }

    if (developer) {
      items = items.filter((p: any) => {
        const b = p.builder && typeof p.builder === 'string' ? p.builder.trim() : '';
        if (!b) return false;
        return developerFilterMatches(developer, b, b);
      });
    }

    if (minBedrooms !== undefined && minBedrooms >= 0) {
      items = items.filter((p: any) => projectHasBedroomOption(p, minBedrooms));
    }

    if (unitType === 'apartment') {
      items = items.filter((p: any) => getProjectBedrooms(p) <= 3);
    } else if (unitType === 'villa') {
      items = items.filter((p: any) => getProjectBedrooms(p) >= 4);
    }

    if (minPrice !== undefined && minPrice > 0) {
      items = items.filter((p: any) => {
        const priceFrom = p.statistics?.total?.price_from ?? 0;
        const priceTo = p.statistics?.total?.price_to ?? 0;
        const floorPrice = priceFrom > 0 ? priceFrom : priceTo;
        return floorPrice >= minPrice;
      });
    }
    if (maxPrice !== undefined && maxPrice > 0) {
      items = items.filter((p: any) => {
        const priceFrom = p.statistics?.total?.price_from ?? 0;
        const priceTo = p.statistics?.total?.price_to ?? 0;
        const ceilingPrice = priceTo > 0 ? priceTo : priceFrom;
        return ceilingPrice <= maxPrice;
      });
    }

    // Dedupe by canonical project name
    const canonicalTitle = (t: string) => (t || '').replace(/\s+\d+$/, '').trim() || (t || '');
    const seen = new Set<string>();
    items = items.filter((p: any) => {
      const can = canonicalTitle(p.title || '').toLowerCase();
      if (seen.has(can)) return false;
      seen.add(can);
      return true;
    });

    // 6. Description-based sort: projects with stored description first
    items.sort((a: any, b: any) => {
      const slugA = (a.slug || '').toString().trim();
      const slugB = (b.slug || '').toString().trim();
      const hasA = hasStoredDescription(slugA) ? 1 : 0;
      const hasB = hasStoredDescription(slugB) ? 1 : 0;
      return hasB - hasA;
    });

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    const transformed = pageItems.map(transformProject);

    return NextResponse.json(
      {
        success: true,
        message: 'Projects fetched',
        data: transformed,
        pagination: { page, limit, total, totalPages },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=900',
        },
      }
    );
  } catch (error) {
    console.error('Error in projects static API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch projects',
        data: [],
        pagination: { page: 1, limit: 9, total: 0, totalPages: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
