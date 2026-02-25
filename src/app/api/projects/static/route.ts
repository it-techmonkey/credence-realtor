import { NextRequest, NextResponse } from 'next/server';
// Import JSON at build time - ensures it works on Vercel (fs.readFileSync can fail in serverless)
import allDataJson from '@/data/all_data.json';

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

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    type: project.type === 'project' || project.type === 'compound' ? 'Off-Plan' : 'Off-Plan',
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
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

    let items = (allDataJson as any)?.data?.items || [];

    // Filter by locality
    if (locality) {
      items = items.filter(
        (p: any) =>
          p.district?.title?.toLowerCase().includes(locality) ||
          p.district?.title?.toLowerCase() === locality
      );
    }

    // Filter by search
    if (search) {
      items = items.filter(
        (p: any) =>
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

    // Filter by price range
    if (minPrice !== undefined && minPrice > 0) {
      items = items.filter((p: any) => {
        const price = p.statistics?.total?.price_from || p.statistics?.total?.price_to || 0;
        return price >= minPrice;
      });
    }
    if (maxPrice !== undefined && maxPrice > 0) {
      items = items.filter((p: any) => {
        const price = p.statistics?.total?.price_from || p.statistics?.total?.price_to || 0;
        return price <= maxPrice;
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
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
