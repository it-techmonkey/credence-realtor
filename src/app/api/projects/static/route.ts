import { NextRequest, NextResponse } from 'next/server';
import allDataJson from '@/data/all_data.json';
import categoriesConfig from '@/data/propertyCategories.config.json';
import waterfrontSlugs from '@/data/waterfront-slugs.json';
import officeSlugs from '@/data/office-slugs.json';
import commercialSlugs from '@/data/commercial-slugs.json';

const AFFORDABLE_MAX = (categoriesConfig as { affordableMaxPriceAED?: number }).affordableMaxPriceAED ?? 1_500_000;
const LUXURY_DEV_NAMES = (categoriesConfig as { luxuryDeveloperNames?: string[] }).luxuryDeveloperNames ?? [];
const WATERFRONT_SET = new Set((waterfrontSlugs as string[]).map((s) => s.toLowerCase().trim()));
const OFFICE_SET = new Set((officeSlugs as string[]).map((s) => s.toLowerCase().trim()));
const COMMERCIAL_SET = new Set((commercialSlugs as string[]).map((s) => s.toLowerCase().trim()));

// Keywords in slug/title to derive Office vs Commercial (all_data has no type field)
const OFFICE_KEYWORDS = ['office', 'offices', 'مكتب', 'مكاتب', 'business bay', 'difc'];
const COMMERCIAL_KEYWORDS = ['commercial', 'retail', 'تجاري', 'تجارة', 'mall'];
const WATERFRONT_KEYWORDS = [
  'waterfront', 'marina', 'beach', 'creek', 'palm', 'island', 'lagoon', 'harbour', 'harbor',
  'jlt', 'jvc', 'jvt', 'bluewaters', 'pearl', 'coast', 'bay', 'sea', 'جميرا', 'مارينا', 'جزيرة', 'شاطئ'
];

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


/** Compute segment/category for filtering and display. Uses slug/title keywords for Office/Commercial when JSON lists are empty. */
function getProjectCategory(project: any): string {
  const slug = (project.slug || '').toString().toLowerCase().trim();
  const combined = projectSlugTitleDistrict(project);
  const builder = (project.builder || '').toString();
  const priceFrom = project.statistics?.total?.price_from ?? project.statistics?.total?.price_to ?? 0;

  if (OFFICE_SET.has(slug)) return 'Office';
  if (textContainsAny(combined, OFFICE_KEYWORDS)) return 'Office';
  if (COMMERCIAL_SET.has(slug)) return 'Commercial';
  if (textContainsAny(combined, COMMERCIAL_KEYWORDS)) return 'Commercial';
  if (WATERFRONT_SET.has(slug)) return 'Waterfront';
  if (textContainsAny(combined, WATERFRONT_KEYWORDS)) return 'Waterfront';
  const isLuxury = LUXURY_DEV_NAMES.some((name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name));
  if (isLuxury) return 'Luxury';
  if (priceFrom > 0 && priceFrom <= AFFORDABLE_MAX) return 'Affordable';
  return 'Off-Plan';
}

// Transform Alnair project to our Property-like format
function transformProject(project: any) {
  const stats = project.statistics?.total || {};
  const minPrice = stats.price_from || 0;
  const maxPrice = stats.price_to || 0;
  const photos = Array.isArray(project.photos) ? project.photos : [];
  const coverSrc = typeof project.cover === 'string' ? project.cover : (project.cover?.src || project.cover?.logo);
  const logoSrc = typeof project.logo === 'string' ? project.logo : (project.logo?.src || project.logo?.logo);
  const firstPhotoSrc = photos[0] && (typeof photos[0] === 'string' ? photos[0] : (photos[0].src || photos[0].logo));
  const mainImage = coverSrc || logoSrc || firstPhotoSrc || null;
  const gallery = photos
    .map((p: any) => (typeof p === 'string' ? p : (p?.src || p?.logo)))
    .filter((src: string) => src && src !== mainImage);

  let readyDate = project.construction_inspection_date;
  if (readyDate && typeof readyDate === 'string') {
    const match = readyDate.match(/(\d{4})-(\d{2})/);
    if (match) readyDate = `Q${Math.ceil(parseInt(match[2], 10) / 3)} ${match[1]}`;
  }

  const category = (project as any)._category !== undefined ? (project as any)._category : getProjectCategory(project);

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    type: project.type === 'project' || project.type === 'compound' ? 'Off-Plan' : 'Off-Plan',
    category,
    price: minPrice || maxPrice,
    minPrice,
    maxPrice,
    mainImage,
    gallery,
    location: (project.district?.title || project.district || '') || '',
    locality: (project.district?.title || project.district || '') || '',
    city: 'Dubai',
    developer: project.builder || '',
    readyDate: readyDate || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '9', 10)));
    const locality = searchParams.get('locality')?.trim().toLowerCase();
    const search = searchParams.get('search')?.trim().toLowerCase();
    const developer = searchParams.get('developer')?.trim().toLowerCase();
    const category = searchParams.get('category')?.trim();
    let minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    let maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

    // Affordable = only projects <= 1.5M AED (enforce so results always match the filter)
    if (category && category.toLowerCase() === 'affordable') {
      const cap = AFFORDABLE_MAX;
      maxPrice = maxPrice !== undefined && maxPrice > 0 ? Math.min(maxPrice, cap) : cap;
    }

    let items = (allDataJson as any)?.data?.items || [];

    // Filter by category
    if (category && category !== 'All') {
      const cat = category.toLowerCase();
      if (cat === 'luxury') {
        // Luxury = properties from luxury developers regardless of other category keywords (waterfront, office, etc.)
        // getProjectCategory checks waterfront/office/commercial BEFORE luxury, causing luxury dev properties to be miscategorised.
        // Fix: match developer name directly so ALL luxury-developer properties are considered, then let the minPrice filter (7M+) narrow the results.
        items = items.filter((p: any) => {
          const builder = (p.builder || '').toString();
          const isLuxuryDev = LUXURY_DEV_NAMES.some(
            (name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name)
          );
          (p as any)._category = 'Luxury';
          return isLuxuryDev;
        });
      } else {
        // Other categories: single pass to compute and filter
        items = items.filter((p: any) => {
          const projectCat = getProjectCategory(p);
          (p as any)._category = projectCat;
          return projectCat.toLowerCase() === cat;
        });
      }
    }

    // Filter by locality
    if (locality) {
      items = items.filter(
        (p: any) =>
          p.district?.title?.toLowerCase().includes(locality) ||
          p.district?.title?.toLowerCase() === locality
      );
    }

    // Filter by search (slug, title, builder, district)
    if (search) {
      items = items.filter(
        (p: any) =>
          (p.slug && (p.slug as string).toLowerCase().includes(search)) ||
          p.title?.toLowerCase().includes(search) ||
          p.builder?.toLowerCase().includes(search) ||
          p.district?.title?.toLowerCase().includes(search)
      );
    }

    // Filter by developer
    if (developer) {
      items = items.filter(
        (p: any) => p.builder?.toLowerCase().includes(developer)
      );
    }

    // Filter by price range: minPrice = project's minimum unit price (price_from) must be >= minPrice
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

    // Dedupe by canonical project name (e.g. "Azizi Venice 1", "Azizi Venice 2" -> keep one "Azizi Venice")
    const canonicalTitle = (t: string) => (t || '').replace(/\s+\d+$/, '').trim() || (t || '');
    const seen = new Set<string>();
    items = items.filter((p: any) => {
      const can = canonicalTitle(p.title || '').toLowerCase();
      if (seen.has(can)) return false;
      seen.add(can);
      return true;
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
