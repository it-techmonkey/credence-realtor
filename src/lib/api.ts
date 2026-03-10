// Alnair API client (legacy). Property listing/detail use static data (/api/projects/static, /api/project/static).
// Call Alnair API directly from browser (bypasses Cloudflare server-side blocking)
const ALNAIR_API_URL = 'https://api.alnair.ae/project/find';

// Use Next.js API route as fallback
const API_BASE_URL = '/api/projects';

// Default UAE bounding box coordinates (covers Dubai, Abu Dhabi, Sharjah, etc.)
const DEFAULT_SEARCH_AREA = {
  east: 56.5,
  north: 26.5,
  south: 24.0,
  west: 54.0,
};

// Alnair API specific filter options for geographic search
export interface AlnairSearchArea {
  east: number;
  north: number;
  south: number;
  west: number;
}

export interface ApiFilterOptions {
  brokerage_id?: string;
  developer_id?: string;
  city?: string | string[];
  category?: string | string[];
  type?: string | string[];
  source_type?: string | string[];
  furnished?: string | string[];
  payment_plan?: string | string[];
  min_price?: number;
  max_price?: number;
  price_range?: {
    min: number;
    max: number;
  };
  min_sq_ft?: number;
  max_sq_ft?: number;
  sq_ft_range?: {
    min: number;
    max: number;
  };
  property_size?: number;
  property_size_range?: {
    min: number;
    max: number;
  };
  min_bedrooms?: string[] | number[];
  max_bedrooms?: string[] | number[];
  min_bathrooms?: string[] | number[];
  max_bathrooms?: string[] | number[];
  handover_year?: number[];
  handover_year_range?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  unit_types?: string[];
  locality?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  search?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  sort_by?: 'created_at' | 'updated_at' | 'min_price' | 'max_price' | 'handover_year' | 'views';
  sort_order?: 'asc' | 'desc';
  prioritize_brokerage_id?: string;
  include_developer?: boolean;
  include_brokerage?: boolean;
  include_floor_plans?: boolean;
  // Alnair API specific options
  search_area?: AlnairSearchArea;
  has_cluster?: number;
  has_boundary?: number;
  zoom?: number;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: ApiPagination;
}

export interface ApiProperty {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  property_name?: string;
  description?: string;
  details?: string;
  overview?: string;
  summary?: string;
  type?: string;
  property_type?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  price?: number;
  price_range?: {
    min?: number;
    max?: number;
  };
  bedrooms?: string | number | string[];
  min_bedrooms?: string[] | string;
  max_bedrooms?: string[] | string;
  bathrooms?: string | number | string[];
  min_bathrooms?: string[] | string;
  max_bathrooms?: string[] | string;
  area?: number;
  sq_ft?: number;
  property_size?: number;
  size?: number;
  sq_ft_range?: {
    min?: number;
    max?: number;
  };
  location?: string;
  address?: string;
  city?: string;
  locality?: string;
  area_name?: string;
  developer?: {
    id?: string;
    name?: string;
  } | string;
  developer_id?: string;
  developer_name?: string;
  brokerage?: {
    id?: string;
    name?: string;
  };
  amenities?: string[] | any[];
  images?: string[];
  image_urls?: string[];
  photo_urls?: string[];
  main_image?: string;
  gallery?: string[];
  created_at?: string;
  createdAt?: string;
  created?: string;
  updated_at?: string;
  updatedAt?: string;
  updated?: string;
  handover_year?: number;
  handover_date?: string;
  ready_date?: string;
  completion_date?: string;
  listing_type?: 'sale' | 'rent';
  listingType?: 'sale' | 'rent';
  furnished?: string;
  payment_plan?: string;
  roi?: {
    firstYear?: number;
    thirdYear?: number;
    fifthYear?: number;
  };
  // Alnair API specific fields
  slug?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  cover?: string;
  construction_percent?: number;
  builder?: string;
  agent_fee?: number;
  project_badges?: string[];
  sales_status?: string[];
  total_units?: number;
  floors?: number | string;
  district?: {
    id?: string;
    title?: string;
  };
  [key: string]: any; // For any additional fields
}

// Transform Alnair project data to our ApiProperty format
function transformAlnairProject(project: any): ApiProperty {
  const stats = project.statistics?.total || {};
  const minPrice = stats.price_from || 0;
  const maxPrice = stats.price_to || 0;
  
  // Extract images
  const photos = project.photos || [];
  const mainImage = project.cover?.src || project.logo?.src || (photos[0]?.src) || null;
  const gallery = photos.map((p: any) => p.src).filter((src: string) => src && src !== mainImage);
  
  // Extract bedrooms and area from unit statistics
  // Units are keyed by codes like "110" (studio), "111" (1BR), "112" (2BR), etc.
  const units = project.statistics?.units || {};
  const villas = project.statistics?.villas || {};
  const allUnits = { ...units, ...villas };
  
  let bedrooms: string[] = [];
  let minBedroomCount = 0;
  let minAreaMt = Infinity; // Track minimum area across all unit types
  let maxAreaMt = 0; // Track maximum area
  
  // Unit type codes: 110=Studio, 111=1BR, 112=2BR, 113=3BR, 114=4BR, 115=5BR, 116=6BR, 117=7BR
  const unitCodeToBedroomMap: { [key: string]: number } = {
    '110': 0, // Studio
    '111': 1,
    '112': 2,
    '113': 3,
    '114': 4,
    '115': 5,
    '116': 6,
    '117': 7,
    '164': 0, // Penthouse (treat as special)
    '462': 0, // Villa (bedrooms from name)
  };
  
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
  
  // Convert area from m² to sq ft (1 m² = 10.764 sq ft)
  const minAreaSqFt = minAreaMt !== Infinity && minAreaMt > 0 
    ? Math.round(minAreaMt * 10.764) 
    : 0;
  const maxAreaSqFt = maxAreaMt > 0 
    ? Math.round(maxAreaMt * 10.764) 
    : 0;
  
  // Extract handover/ready date
  let handoverYear = project.handover?.year;
  let readyDate = project.construction_inspection_date || 
                  (handoverYear ? `${handoverYear}` : undefined);
  
  // Extract description from project
  const description = project.description || project.about || '';
  
  // Determine property type
  let propertyType = 'Off-Plan';
  if (project.construction_percent >= 100) {
    propertyType = 'Ready';
  }
  
  return {
    id: project.id?.toString(),
    _id: project.id?.toString(),
    slug: project.slug,
    title: project.title,
    name: project.title,
    property_name: project.title,
    description: description,
    type: propertyType,
    category: 'Residential',
    
    // Location
    latitude: parseFloat(project.latitude) || 0,
    longitude: parseFloat(project.longitude) || 0,
    location: project.district?.title || '',
    area_name: project.district?.title || '',
    locality: project.district?.title || '',
    city: 'Dubai',
    
    // Price
    min_price: minPrice,
    max_price: maxPrice,
    price: minPrice || maxPrice,
    price_range: { min: minPrice, max: maxPrice },
    
    // Images
    main_image: mainImage,
    images: [mainImage, ...gallery].filter(Boolean),
    gallery: gallery,
    logo: project.logo?.src,
    cover: project.cover?.src,
    
    // Bedrooms (as numeric value for display)
    bedrooms: minBedroomCount > 0 ? minBedroomCount : (bedrooms.length > 0 ? bedrooms[0] : undefined),
    min_bedrooms: bedrooms,
    
    // Area (range: min to max)
    sq_ft: minAreaSqFt,
    area: minAreaSqFt,
    property_size: minAreaSqFt,
    area_min: minAreaSqFt,
    area_max: maxAreaSqFt,
    
    // Developer
    developer: project.builder ? { name: project.builder } : undefined,
    developer_name: project.builder,
    
    // Construction & Dates
    handover_year: handoverYear,
    ready_date: readyDate,
    handover_date: readyDate,
    completion_date: readyDate,
    construction_percent: project.construction_percent,
    
    // Statistics
    total_units: stats.units_count || stats.count || 0,
    floors: stats.units_max_floor || project.floors || 0,
    
    // Agent fee
    agent_fee: project.agent_fee_value || project.agent_fee,
    
    // Badges and status
    project_badges: project.catalogs?.project_badges || project.project_badges || [],
    sales_status: project.catalogs?.project_sales_status || project.sales_status || [],
    
    // Amenities
    amenities: project.amenities || [],
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProperties(
  filters: ApiFilterOptions = {},
  page: number = 1,
  limit: number = 500
): Promise<ApiResponse<ApiProperty[]>> {
  // Check if running in browser - call Alnair directly to bypass Cloudflare server-side blocking
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    // Build Alnair API URL with query parameters (browser request)
    const url = new URL(ALNAIR_API_URL);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('page', page.toString());
    
    // Filter for Dubai only (city_id=1)
    url.searchParams.append('city_id', '1');
    
    // Add developer filter using builders[] parameter
    if (filters.developer_id) {
      url.searchParams.append('builders[0]', filters.developer_id.toString());
    }
    
    // Add city filter if provided
    if (filters.city) {
      const cityValue = Array.isArray(filters.city) ? filters.city[0] : filters.city;
      // Map city names to Alnair city IDs (1 = Dubai, etc.)
      const cityMap: { [key: string]: string } = {
        'dubai': '1',
        'abu dhabi': '2',
        'abu_dhabi': '2',
        'sharjah': '3',
        'ajman': '4',
        'ras al khaimah': '5',
        'ras_al_khaimah': '5',
        'fujairah': '6',
        'umm al quwain': '7',
        'umm_al_quwain': '7',
      };
      const cityId = cityMap[cityValue.toLowerCase()] || cityValue;
      if (cityId) {
        url.searchParams.append('city_id', cityId);
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Alnair API error: ${response.status}`);
      }

      const alnairData = await response.json();
      const items = alnairData?.data?.items || [];
      
      // Transform Alnair response to our format
      const transformedData = items.map((project: any) => transformAlnairProject(project));
      
      // Alnair API returns: count (total), page, pages (total pages)
      const total = alnairData?.count || alnairData?.data?.pagination?.total || items.length;
      const totalPages = alnairData?.pages || alnairData?.data?.pagination?.total_pages || Math.ceil(total / limit);
      
      return {
        success: true,
        message: 'Properties fetched successfully from Alnair',
        data: transformedData,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      console.error('Error fetching from Alnair directly:', error);
      // Fall back to server-side proxy
    }
  }

  // Fallback: Use Next.js API route (server-side)
  const url = `${API_BASE_URL}?page=${page}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data: ApiResponse<ApiProperty[]> = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

// Fetch property by ID from the new Alnair API endpoint via Next.js API route
// The API route acts as middleware/proxy to add the cf_clearance cookie header
// since browsers cannot set Cookie headers for cross-origin requests
async function fetchPropertyByIdFromNewApi(alnairId: string | number): Promise<ApiProperty | null> {
  // Only works in browser (client-side)
  const isClient = typeof window !== 'undefined';
  if (!isClient) {
    console.warn('fetchPropertyByIdFromNewApi: Not running in browser, cannot fetch');
    return null;
  }

  try {
    const idStr = typeof alnairId === 'number' ? alnairId.toString() : alnairId;
    
    // Use Next.js API route as proxy/middleware to add cookie header
    // The API route will add the cf_clearance cookie and forward the request
    const apiUrl = `/api/property/${idStr}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching property via API route (with cookie middleware):', apiUrl);
      console.log('Alnair ID:', idStr);
    }
    
    // Client-side request to our API route (which acts as middleware/proxy)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 404 is expected when the property doesn't exist in Alnair; avoid noisy logs
      if (response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.info(`Property not found (404): ${apiUrl}`);
        }
        return null;
      }
      console.error(`API route error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Error response:', errorData);
      return null;
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('API route returned unsuccessful response:', result);
      return null;
    }

    const data = result.data;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Property data received from API route (with cookie middleware)');
    }
    
    // The response format may vary, so we need to handle different structures
    // Try to extract the project data from various possible response structures
    let projectData = null;
    
    if (data?.data) {
      projectData = data.data;
    } else if (data?.project) {
      projectData = data.project;
    } else if (data?.id || data?.title || data?.slug) {
      // If the response itself is the project object
      projectData = data;
    } else if (Array.isArray(data) && data.length > 0) {
      projectData = data[0];
    } else if (data && typeof data === 'object') {
      // Try to find any nested project-like object
      for (const key in data) {
        if (data[key] && typeof data[key] === 'object' && (data[key].id || data[key].title || data[key].slug)) {
          projectData = data[key];
          break;
        }
      }
    }

    if (projectData && (projectData.id || projectData.slug || projectData.title)) {
      return transformAlnairProject(projectData);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('API route response structure (unable to parse):', JSON.stringify(data, null, 2));
    }

    return null;
  } catch (error) {
    console.error('Error fetching property from new Alnair API:', error);
    return null;
  }
}

export async function fetchPropertyById(id: string): Promise<ApiProperty | null> {
  // Only works in browser (client-side)
  const isClient = typeof window !== 'undefined';
  if (!isClient) {
    console.warn('fetchPropertyById: Not running in browser, cannot fetch');
    return null;
  }

  // The new API requires the numeric alnair ID, not the slug
  // Try to parse the ID as a number first
  const numericId = parseInt(id, 10);
  
  if (!isNaN(numericId)) {
    // Use the new API with numeric ID
    const result = await fetchPropertyByIdFromNewApi(numericId);
    if (result) {
      return result;
    }
  }
  
  // If ID is not numeric (might be a slug), try to find the property in the list
  // and get its numeric ID, then use the new API
  try {
    const url = new URL(ALNAIR_API_URL);
    url.searchParams.append('limit', '100');
    url.searchParams.append('page', '1');
    url.searchParams.append('city_id', '1');
    url.searchParams.append('search_area[east]', '56.0');
    url.searchParams.append('search_area[north]', '25.5');
    url.searchParams.append('search_area[south]', '24.5');
    url.searchParams.append('search_area[west]', '54.5');
    url.searchParams.append('has_cluster', '0');
    url.searchParams.append('has_boundary', '0');
    url.searchParams.append('zoom', '10');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const alnairData = await response.json();
      const items = alnairData?.data?.items || [];
      
      // Find by ID or slug (case-insensitive for slug)
      const project = items.find((p: any) => 
        p.id?.toString() === id ||
        p.slug === id ||
        p.slug?.toLowerCase() === id.toLowerCase()
      );
      
      if (project && project.id) {
        // Found the project, now fetch full details using the numeric ID
        const fullDetails = await fetchPropertyByIdFromNewApi(project.id);
        if (fullDetails) {
          return fullDetails;
        }
        // If new API fails, use the list data
        return transformAlnairProject(project);
      }
    }
  } catch (error) {
    console.error('Error searching for property:', error);
  }
  
  return null;
}

