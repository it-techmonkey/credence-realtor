import { NextRequest, NextResponse } from 'next/server';
import { stripPropertyNumberFromTitle } from '@/lib/staticPropertyData';

// Alnair API Base URL for real estate projects
const ALNAIR_API_URL = 'https://api.alnair.ae/project/find';

// Default Dubai bounding box coordinates (covers greater Dubai area)
const DEFAULT_SEARCH_AREA = {
  east: 55.529708862304695,
  north: 25.19375777608886,
  south: 25.114201938326083,
  west: 54.99275207519532,
};

// Cache duration: 5 minutes for filtered searches, 10 minutes for general queries
const CACHE_DURATION_FILTERED = 300; // 5 minutes
const CACHE_DURATION_GENERAL = 600; // 10 minutes

// Simple in-memory cache (for production, consider using Redis or similar)
const cache = new Map<string, { data: any; timestamp: number; duration: number }>();

interface AlnairSearchParams {
  page?: string;
  limit?: string;
  search_area?: {
    east?: number;
    north?: number;
    south?: number;
    west?: number;
  };
  has_cluster?: number;
  has_boundary?: number;
  zoom?: number;
}

function getCacheKey(params: AlnairSearchParams): string {
  return `alnair:${JSON.stringify(params)}`;
}

function getCacheDuration(params: AlnairSearchParams): number {
  // If there are specific search area params, use shorter cache
  const hasSearchArea = params.search_area && 
    (params.search_area.east !== DEFAULT_SEARCH_AREA.east ||
     params.search_area.north !== DEFAULT_SEARCH_AREA.north);
  return hasSearchArea ? CACHE_DURATION_FILTERED : CACHE_DURATION_GENERAL;
}

// Transform Alnair API response to match our internal API format
function transformAlnairResponse(alnairData: any, page: number, limit: number) {
  const items = alnairData?.data?.items || [];
  
  // Unit type codes: 110=Studio, 111=1BR, 112=2BR, 113=3BR, 114=4BR, etc.
  const unitCodeToBedroomMap: { [key: string]: number } = {
    '110': 0, // Studio
    '111': 1,
    '112': 2,
    '113': 3,
    '114': 4,
    '115': 5,
    '116': 6,
    '117': 7,
    '164': 0, // Penthouse
    '462': 0, // Villa
  };
  
  // Transform each project to match our ApiProperty interface
  const transformedData = items.map((project: any) => {
    // Extract price information from statistics
    const stats = project.statistics?.total || {};
    const minPrice = stats.price_from || 0;
    const maxPrice = stats.price_to || 0;
    
    // Extract images
    const photos = project.photos || [];
    const mainImage = project.cover?.src || project.logo?.src || (photos[0]?.src) || null;
    const gallery = photos.map((p: any) => p.src).filter((src: string) => src && src !== mainImage);
    
    // Extract bedrooms and area from unit statistics
    const units = project.statistics?.units || {};
    const villas = project.statistics?.villas || {};
    const allUnits = { ...units, ...villas };
    
    let bedrooms: string[] = [];
    let minBedroomCount = 0;
    let minAreaMt = Infinity;
    let maxAreaMt = 0;
    
    if (allUnits && Object.keys(allUnits).length > 0) {
      Object.entries(allUnits).forEach(([key, unitData]: [string, any]) => {
        // Get bedroom count from unit code
        const bedroomNum = unitCodeToBedroomMap[key];
        if (bedroomNum !== undefined) {
          if (bedroomNum === 0) {
            bedrooms.push('Studio');
          } else {
            bedrooms.push(`${bedroomNum} BR`);
          }
          if (bedroomNum > 0 && (minBedroomCount === 0 || bedroomNum < minBedroomCount)) {
            minBedroomCount = bedroomNum;
          }
        }
        
        // Extract area from unit data (area is in m²)
        if (unitData.area_from && unitData.area_from > 0) {
          minAreaMt = Math.min(minAreaMt, unitData.area_from);
        }
        if (unitData.area_to && unitData.area_to > 0) {
          maxAreaMt = Math.max(maxAreaMt, unitData.area_to);
        }
      });
    }
    
    // Convert area from m² to sq ft
    const minAreaSqFt = minAreaMt !== Infinity && minAreaMt > 0 
      ? Math.round(minAreaMt * 10.764) 
      : 0;
    const maxAreaSqFt = maxAreaMt > 0 
      ? Math.round(maxAreaMt * 10.764) 
      : 0;
    
    const displayTitle = stripPropertyNumberFromTitle(project.title || '');
    return {
      id: project.id,
      _id: project.id,
      slug: project.slug,
      title: displayTitle,
      name: displayTitle,
      property_name: displayTitle,
      type: project.type || 'project',
      category: 'Residential', // Default category
      
      // Price information
      min_price: minPrice,
      max_price: maxPrice,
      price: minPrice || maxPrice,
      
      // Location information
      latitude: parseFloat(project.latitude) || 0,
      longitude: parseFloat(project.longitude) || 0,
      location: project.district?.title || '',
      city: 'Dubai',
      locality: project.district?.title || '',
      area_name: project.district?.title || '',
      
      // Developer information
      developer: project.builder || '',
      developer_name: project.builder || '',
      
      // Construction status
      construction_percent: project.construction_percent,
      handover_date: project.construction_inspection_date,
      ready_date: project.construction_inspection_date,
      completion_date: project.construction_inspection_date,
      
      // Images
      main_image: mainImage,
      images: [mainImage, ...gallery].filter(Boolean),
      gallery: gallery,
      logo: project.logo?.src || null,
      cover: project.cover?.src || null,
      
      // Statistics
      sq_ft: minAreaSqFt,
      area: minAreaSqFt,
      property_size: minAreaSqFt,
      area_min: minAreaSqFt,
      area_max: maxAreaSqFt,
      floors: stats.units_max_floor || 0,
      
      // Bedrooms (extracted from unit types)
      bedrooms: minBedroomCount > 0 ? minBedroomCount : (bedrooms.length > 0 ? bedrooms[0] : undefined),
      min_bedrooms: bedrooms,
      
      // Unit counts
      total_units: stats.units_count || stats.count || 0,
      
      // Agent fee
      agent_fee: project.agent_fee_value,
      
      // Badges and status
      project_badges: project.catalogs?.project_badges || [],
      sales_status: project.catalogs?.project_sales_status || [],
      
      // Additional metadata
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // Calculate pagination
  const total = items.length; // Note: Alnair API doesn't return total count in response
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    success: true,
    message: 'Properties fetched successfully',
    data: transformedData,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      total_pages: totalPages,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const urlSearchParams = request.nextUrl.searchParams;
    const page = urlSearchParams.get('page') || '1';
    const limit = urlSearchParams.get('limit') || '30';

    // Get the request body (filters) - we'll use these for future filter support
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body might be empty, that's okay
      body = {};
    }

    // Build Alnair API URL with query parameters
    const url = new URL(ALNAIR_API_URL);
    url.searchParams.append('limit', limit);
    url.searchParams.append('page', page);
    
    // Filter for Dubai only (city_id=1)
    url.searchParams.append('city_id', '1');
    
    // Add default search area (Dubai)
    const searchArea = body.search_area || DEFAULT_SEARCH_AREA;
    url.searchParams.append('search_area[east]', searchArea.east.toString());
    url.searchParams.append('search_area[north]', searchArea.north.toString());
    url.searchParams.append('search_area[south]', searchArea.south.toString());
    url.searchParams.append('search_area[west]', searchArea.west.toString());
    
    // Add clustering and boundary options
    url.searchParams.append('has_cluster', (body.has_cluster ?? 1).toString());
    url.searchParams.append('has_boundary', (body.has_boundary ?? 0).toString());
    url.searchParams.append('zoom', (body.zoom ?? 11).toString());

    // Check cache
    const cacheParams: AlnairSearchParams = {
      page,
      limit,
      search_area: searchArea,
      has_cluster: body.has_cluster ?? 1,
      has_boundary: body.has_boundary ?? 0,
      zoom: body.zoom ?? 11,
    };
    const cacheKey = getCacheKey(cacheParams);
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.duration * 1000) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `public, s-maxage=${cached.duration}, stale-while-revalidate=${cached.duration * 2}`,
          'X-Cache': 'HIT',
        },
      });
    }

    // Log request for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Alnair API Request ===');
      console.log('URL:', url.toString());
    }

    // Fetch from Alnair API (GET request) with browser-like headers to bypass Cloudflare
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
      },
      next: { revalidate: 300 },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('=== Alnair API Response ===');
      console.log('Status:', response.status);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alnair API error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `API error: ${response.status} ${response.statusText}`,
          data: [],
          error: errorText 
        },
        { 
          status: response.status,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const alnairData = await response.json();
    
    // Transform the response to our internal format
    const transformedData = transformAlnairResponse(alnairData, parseInt(page), parseInt(limit));
    
    // Store in cache
    const cacheDuration = getCacheDuration(cacheParams);
    cache.set(cacheKey, {
      data: transformedData,
      timestamp: now,
      duration: cacheDuration,
    });

    // Clean up old cache entries (keep last 100 entries)
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.clear();
      entries.slice(0, 100).forEach(([key, value]) => cache.set(key, value));
    }

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch properties',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

// Also support GET requests for simpler access
export async function GET(request: NextRequest) {
  try {
    const urlSearchParams = request.nextUrl.searchParams;
    const page = urlSearchParams.get('page') || '1';
    const limit = urlSearchParams.get('limit') || '30';
    
    // Get search area from query params or use defaults
    const east = parseFloat(urlSearchParams.get('east') || '') || DEFAULT_SEARCH_AREA.east;
    const north = parseFloat(urlSearchParams.get('north') || '') || DEFAULT_SEARCH_AREA.north;
    const south = parseFloat(urlSearchParams.get('south') || '') || DEFAULT_SEARCH_AREA.south;
    const west = parseFloat(urlSearchParams.get('west') || '') || DEFAULT_SEARCH_AREA.west;
    const hasCluster = parseInt(urlSearchParams.get('has_cluster') || '1');
    const hasBoundary = parseInt(urlSearchParams.get('has_boundary') || '0');
    const zoom = parseInt(urlSearchParams.get('zoom') || '11');

    // Build Alnair API URL
    const url = new URL(ALNAIR_API_URL);
    url.searchParams.append('limit', limit);
    url.searchParams.append('page', page);
    url.searchParams.append('search_area[east]', east.toString());
    url.searchParams.append('search_area[north]', north.toString());
    url.searchParams.append('search_area[south]', south.toString());
    url.searchParams.append('search_area[west]', west.toString());
    url.searchParams.append('has_cluster', hasCluster.toString());
    url.searchParams.append('has_boundary', hasBoundary.toString());
    url.searchParams.append('zoom', zoom.toString());

    // Check cache
    const cacheParams: AlnairSearchParams = {
      page,
      limit,
      search_area: { east, north, south, west },
      has_cluster: hasCluster,
      has_boundary: hasBoundary,
      zoom: zoom,
    };
    const cacheKey = getCacheKey(cacheParams);
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.duration * 1000) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `public, s-maxage=${cached.duration}, stale-while-revalidate=${cached.duration * 2}`,
          'X-Cache': 'HIT',
        },
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('=== Alnair API GET Request ===');
      console.log('URL:', url.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alnair API error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `API error: ${response.status} ${response.statusText}`,
          data: [],
          error: errorText 
        },
        { 
          status: response.status,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const alnairData = await response.json();
    const transformedData = transformAlnairResponse(alnairData, parseInt(page), parseInt(limit));
    
    // Store in cache
    const cacheDuration = getCacheDuration(cacheParams);
    cache.set(cacheKey, {
      data: transformedData,
      timestamp: now,
      duration: cacheDuration,
    });

    // Clean up old cache entries
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.clear();
      entries.slice(0, 100).forEach(([key, value]) => cache.set(key, value));
    }

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch properties',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

