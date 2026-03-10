import { NextRequest, NextResponse } from 'next/server';
import allDataJson from '@/data/all_data.json';
import categoriesConfig from '@/data/propertyCategories.config.json';
import officeSlugs from '@/data/office-slugs.json';
import commercialSlugs from '@/data/commercial-slugs.json';
import {
  UAE_CITY_IDS,
  getCityName,
  getCityIdFromParam,
  getProjectType,
  getMainImage,
  hasStoredDescription,
  descriptionContainsWaterfrontOrLagoon,
} from '@/lib/staticPropertyData';

const AFFORDABLE_MAX = (categoriesConfig as { affordableMaxPriceAED?: number }).affordableMaxPriceAED ?? 1_500_000;
const LUXURY_DEV_NAMES = (categoriesConfig as { luxuryDeveloperNames?: string[] }).luxuryDeveloperNames ?? [];
const OFFICE_SET = new Set((officeSlugs as string[]).map((s) => s.toLowerCase().trim()));
const COMMERCIAL_SET = new Set((commercialSlugs as string[]).map((s) => s.toLowerCase().trim()));

const OFFICE_KEYWORDS = ['office', 'offices', 'مكتب', 'مكاتب', 'business bay', 'difc'];
const COMMERCIAL_KEYWORDS = ['commercial', 'retail', 'تجاري', 'تجارة', 'mall'];

/** Map normalized developer name (from filter) to possible builder values in all_data (English + Arabic). Ensures filter by "Emaar" matches builder "إمار". */
const DEVELOPER_SEARCH_TERMS: Record<string, string[]> = {
  emaar: ['emaar', 'إمار'],
  nakheel: ['nakheel', 'نخيل'],
  meraas: ['meraas', 'ميراس'],
  damac: ['damac', 'داماك'],
  binghatti: ['binghatti', 'بينغهاتي', 'bingati'],
  azizi: ['azizi', 'عزيزي'],
  sobha: ['sobha', 'سوبها', 'سوبا'],
  ellington: ['ellington', 'إلينغتون'],
  omniyat: ['omniyat', 'أومنيات', 'الدار'],
  imtiaz: ['imtiaz', 'ايمتياز', 'imtiyaz', 'امتياز'],
  aldar: ['aldar', 'الدار'],
  dubai: ['dubai properties', 'دبي'],
  select: ['select group', 'سيلكت'],
  majid: ['majid al futtaim', 'ماجد الفطيم'],
  jacob: ['jacob', 'جاكوب'],
};

function developerFilterMatches(developerParam: string, builder: string | undefined): boolean {
  if (!builder || typeof builder !== 'string') return false;
  const b = builder.trim();
  if (!b) return false;
  const paramNorm = developerParam.trim().toLowerCase().replace(/\s+(properties|development|group|holding|holdings|llc|llc\.?)$/i, '');
  const key = paramNorm.split(/\s+/)[0] || paramNorm;
  const terms = DEVELOPER_SEARCH_TERMS[key] || [developerParam.trim(), paramNorm];
  return terms.some(
    (term) => b.toLowerCase().includes(term.toLowerCase()) || b.includes(term)
  );
}

/** Unit type codes in statistics.units: 110=Studio(0), 111=1BR, 112=2BR, 113=3BR, 114=4BR, 115=5BR, 116=6BR, 117=7BR */
const UNIT_CODE_TO_BEDROOMS: Record<string, number> = {
  '110': 0, '111': 1, '112': 2, '113': 3, '114': 4, '115': 5, '116': 6, '117': 7,
};
function getProjectBedrooms(project: any): number {
  const units = project?.statistics?.units || {};
  let maxBedrooms = 0;
  for (const key of Object.keys(units)) {
    const br = UNIT_CODE_TO_BEDROOMS[key];
    if (br !== undefined && br > maxBedrooms) maxBedrooms = br;
  }
  const villas = project?.statistics?.villas || {};
  for (const key of Object.keys(villas)) {
    const br = UNIT_CODE_TO_BEDROOMS[key];
    if (br !== undefined && br > maxBedrooms) maxBedrooms = br;
  }
  return maxBedrooms;
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
  const isLuxury = LUXURY_DEV_NAMES.some((name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name));
  if (isLuxury) return 'Luxury';
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
    const minBedrooms = bedroomsParam ? parseInt(bedroomsParam, 10) : undefined;
    let minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    let maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

    if (category && category.toLowerCase() === 'affordable') {
      const cap = AFFORDABLE_MAX;
      maxPrice = maxPrice !== undefined && maxPrice > 0 ? Math.min(maxPrice, cap) : cap;
    }

    let items: any[] = (allDataJson as any)?.data?.items || [];

    // 1. UAE only
    items = items.filter((p: any) => {
      const cid = p.city_id != null ? (typeof p.city_id === 'string' ? parseInt(p.city_id, 10) : p.city_id) : null;
      return cid != null && !isNaN(cid) && UAE_CITY_IDS.has(cid);
    });

    // 2. Remove 0 AED (price_from === 0 && price_to === 0)
    items = items.filter((p: any) => {
      const from = p.statistics?.total?.price_from ?? 0;
      const to = p.statistics?.total?.price_to ?? 0;
      return from > 0 || to > 0;
    });

    // 3. City filter
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
          const builder = (p.builder || '').toString();
          const isLuxuryDev = LUXURY_DEV_NAMES.some(
            (name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name)
          );
          (p as any)._category = 'Luxury';
          return isLuxuryDev;
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
      items = items.filter((p: any) => developerFilterMatches(developer, p.builder));
    }

    if (minBedrooms !== undefined && minBedrooms > 0) {
      items = items.filter((p: any) => getProjectBedrooms(p) >= minBedrooms);
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
