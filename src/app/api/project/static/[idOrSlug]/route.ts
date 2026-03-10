import { NextRequest, NextResponse } from 'next/server';
import allDataJson from '@/data/all_data.json';
import categoriesConfig from '@/data/propertyCategories.config.json';
import officeSlugs from '@/data/office-slugs.json';
import commercialSlugs from '@/data/commercial-slugs.json';
import {
  UAE_CITY_IDS,
  getCityName,
  getProjectType,
  getMainImage,
  descriptionContainsWaterfrontOrLagoon,
} from '@/lib/staticPropertyData';

const AFFORDABLE_MAX = (categoriesConfig as { affordableMaxPriceAED?: number }).affordableMaxPriceAED ?? 1_500_000;
const LUXURY_DEV_NAMES = (categoriesConfig as { luxuryDeveloperNames?: string[] }).luxuryDeveloperNames ?? [];
const OFFICE_SET = new Set((officeSlugs as string[]).map((s) => s.toLowerCase().trim()));
const COMMERCIAL_SET = new Set((commercialSlugs as string[]).map((s) => s.toLowerCase().trim()));
const OFFICE_KEYWORDS = ['office', 'offices', 'مكتب', 'مكاتب'];
const COMMERCIAL_KEYWORDS = ['commercial', 'retail', 'تجاري', 'تجارة'];

const UNIT_CODE_TO_BEDROOMS: Record<string, number> = {
  '110': 0, '111': 1, '112': 2, '113': 3, '114': 4, '115': 5, '116': 6, '117': 7,
};

function slugOrTitleMatches(text: string, keywords: string[]): boolean {
  const t = (text || '').toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

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

function getProjectCategory(project: any): string {
  const slug = (project.slug || '').toString().toLowerCase().trim();
  const title = (project.title || '').toString();
  const builder = (project.builder || '').toString();
  const priceFrom = project.statistics?.total?.price_from ?? project.statistics?.total?.price_to ?? 0;
  if (OFFICE_SET.has(slug)) return 'Office';
  if (slugOrTitleMatches(slug, OFFICE_KEYWORDS) || slugOrTitleMatches(title, OFFICE_KEYWORDS)) return 'Office';
  if (COMMERCIAL_SET.has(slug)) return 'Commercial';
  if (slugOrTitleMatches(slug, COMMERCIAL_KEYWORDS) || slugOrTitleMatches(title, COMMERCIAL_KEYWORDS)) return 'Commercial';
  if (descriptionContainsWaterfrontOrLagoon(project.slug)) return 'Waterfront';
  if (LUXURY_DEV_NAMES.some((name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name))) return 'Luxury';
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

  const category = getProjectCategory(project);
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
    statistics: project.statistics,
    district: project.district,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    if (!idOrSlug?.trim()) {
      return NextResponse.json(
        { success: false, message: 'ID or slug required', data: null },
        { status: 400 }
      );
    }

    const items = (allDataJson as any)?.data?.items || [];

    const idOrSlugStr = idOrSlug.trim();
    const isNumeric = /^\d+$/.test(idOrSlugStr);
    const idNum = isNumeric ? parseInt(idOrSlugStr, 10) : null;

    const project = items.find((p: any) => {
      if (idNum !== null) return p.id === idNum;
      return (
        p.slug === idOrSlugStr ||
        p.slug?.toLowerCase() === idOrSlugStr.toLowerCase()
      );
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found', data: null },
        { status: 404 }
      );
    }

    const cityId = project.city_id != null
      ? (typeof project.city_id === 'string' ? parseInt(project.city_id, 10) : project.city_id)
      : null;
    if (cityId == null || isNaN(cityId) || !UAE_CITY_IDS.has(cityId)) {
      return NextResponse.json(
        { success: false, message: 'Project not found', data: null },
        { status: 404 }
      );
    }

    const transformed = transformProject(project);

    return NextResponse.json(
      { success: true, message: 'Project found', data: transformed },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error in project static API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch project',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
