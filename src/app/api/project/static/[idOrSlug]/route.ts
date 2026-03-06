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
const OFFICE_KEYWORDS = ['office', 'offices', 'مكتب', 'مكاتب'];
const COMMERCIAL_KEYWORDS = ['commercial', 'retail', 'تجاري', 'تجارة'];

function slugOrTitleMatches(text: string, keywords: string[]): boolean {
  const t = (text || '').toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
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
  if (WATERFRONT_SET.has(slug)) return 'Waterfront';
  if (LUXURY_DEV_NAMES.some((name) => builder.toLowerCase().includes(name.toLowerCase()) || builder.includes(name))) return 'Luxury';
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

  const category = getProjectCategory(project);

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
