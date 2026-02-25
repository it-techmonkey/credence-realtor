import { fetchProperties, fetchPropertyById as fetchPropertyByIdApi, ApiProperty, ApiFilterOptions } from './api';
import { getDeveloperIdByName, getDeveloperIdByNameAsync, fetchDevelopersMapping } from '@/utils/developerMapping';
import { containsArabic, translateToEnglish, translateAmenities } from '@/lib/translate';

// Helper function to convert text numbers to integers
function textToNumber(text: string): number | null {
  if (!text || typeof text !== 'string') return null;
  
  const normalized = text.toLowerCase().trim();
  
  // Map of text numbers to integers
  const numberMap: { [key: string]: number } = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
  };
  
  // Check if it's a direct match
  if (numberMap[normalized] !== undefined) {
    return numberMap[normalized];
  }
  
  // Try parsing as regular number
  const parsed = parseInt(normalized, 10);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  return null;
}

// Property interface - matches current structure
export interface Property {
  id?: string | number;
  slug?: string;
  title: string;
  description: string;
  type: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaMin?: number;
  areaMax?: number;
  location: string;
  city?: string;
  locality?: string;
  category?: string;
  developer?: string;
  amenities: string[];
  mainImage: string;
  gallery: string[];
  createdAt?: string;
  updatedAt?: string;
  readyDate?: string;
  listingType?: 'sale' | 'rent';
  floors?: number | string;
  security?: boolean | string;
  furnished?: string;
  paymentPlan?: string;
  roi?: {
    firstYear: number;
    thirdYear: number;
    fifthYear: number;
  };
  // Alnair API specific fields
  latitude?: number;
  longitude?: number;
  constructionPercent?: number;
  totalUnits?: number;
  agentFee?: number;
  projectBadges?: string[];
  salesStatus?: string[];
}

// Map API property to our Property interface
function mapApiPropertyToProperty(apiProperty: ApiProperty): Property {
  // Log the raw API property for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Mapping API Property ===');
    console.log('Raw bedrooms value:', apiProperty.bedrooms, 'Type:', typeof apiProperty.bedrooms);
    console.log('Full property:', JSON.stringify(apiProperty, null, 2));
  }

  // ID - can be string or number
  const id = apiProperty.id || apiProperty._id || undefined;

  // Title - check multiple possible fields
  const title = apiProperty.title || 
                apiProperty.name || 
                apiProperty.property_name ||
                'Untitled Property';

  // Description - check multiple possible fields
  const description = apiProperty.description || 
                      apiProperty.details || 
                      apiProperty.overview ||
                      apiProperty.summary ||
                      '';

  // Type - check multiple possible fields and ensure it's a string
  const typeValue = apiProperty.type || 
                    apiProperty.property_type || 
                    apiProperty.category ||
                    'Property';
  // Convert to string if it's not already
  const type = typeof typeValue === 'string' ? typeValue : String(typeValue || 'Property');

  // Price - use min_price if available, otherwise max_price, otherwise check price field
  const price = apiProperty.min_price ?? 
                apiProperty.max_price ?? 
                apiProperty.price ?? 
                (apiProperty.price_range?.min ?? apiProperty.price_range?.max) ??
                0;

  // Area - prefer sq_ft, then area, then property_size, only use if > 0
  const areaValue = apiProperty.sq_ft ?? 
                   apiProperty.area ?? 
                   apiProperty.property_size ??
                   apiProperty.size ??
                   (apiProperty.sq_ft_range?.min ?? apiProperty.sq_ft_range?.max) ??
                   0;
  const area = (typeof areaValue === 'number' && areaValue > 0) ? areaValue : 0;
  
  // Area range (min/max)
  const areaMin = (typeof apiProperty.area_min === 'number' && apiProperty.area_min > 0) ? apiProperty.area_min : area;
  const areaMax = (typeof apiProperty.area_max === 'number' && apiProperty.area_max > 0) ? apiProperty.area_max : area;

  // Bedrooms - always convert to integer (handles text numbers like "one", "two", "three")
  // Use undefined instead of 0 to indicate missing/invalid data
  let bedrooms: number | undefined = undefined;
  if (apiProperty.bedrooms !== undefined && apiProperty.bedrooms !== null) {
    if (typeof apiProperty.bedrooms === 'string') {
      const trimmed = apiProperty.bedrooms.trim();
      // Skip empty strings or "zero"
      if (trimmed === '' || trimmed.toLowerCase() === 'zero') {
        bedrooms = undefined;
      } else {
        // Try converting text number first
        const textNumber = textToNumber(trimmed);
        if (textNumber !== null && textNumber > 0) {
          bedrooms = textNumber;
        } else {
          // Fallback to parseInt
          const parsed = parseInt(trimmed, 10);
          bedrooms = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
        }
      }
    } else if (Array.isArray(apiProperty.bedrooms) && apiProperty.bedrooms.length > 0) {
      const firstValue = apiProperty.bedrooms[0];
      if (typeof firstValue === 'string') {
        const trimmed = firstValue.trim();
        if (trimmed === '' || trimmed.toLowerCase() === 'zero') {
          bedrooms = undefined;
        } else {
          // Try converting text number first
          const textNumber = textToNumber(trimmed);
          if (textNumber !== null && textNumber > 0) {
            bedrooms = textNumber;
          } else {
            // Fallback to parseInt
            const parsed = parseInt(trimmed, 10);
            bedrooms = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
          }
        }
      } else if (typeof firstValue === 'number' && firstValue > 0) {
        bedrooms = Math.floor(firstValue);
      }
    } else if (typeof apiProperty.bedrooms === 'number' && apiProperty.bedrooms > 0) {
      bedrooms = Math.floor(apiProperty.bedrooms);
    }
  } else if (apiProperty.min_bedrooms) {
    const minBedrooms = Array.isArray(apiProperty.min_bedrooms) 
      ? apiProperty.min_bedrooms[0] 
      : apiProperty.min_bedrooms;
    if (typeof minBedrooms === 'string') {
      const trimmed = minBedrooms.trim();
      if (trimmed === '' || trimmed.toLowerCase() === 'zero') {
        bedrooms = undefined;
      } else {
        // Try converting text number first
        const textNumber = textToNumber(trimmed);
        if (textNumber !== null && textNumber > 0) {
          bedrooms = textNumber;
        } else {
          // Fallback to parseInt
          const parsed = parseInt(trimmed, 10);
          bedrooms = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
        }
      }
    } else if (typeof minBedrooms === 'number' && minBedrooms > 0) {
      bedrooms = Math.floor(minBedrooms);
    }
  }
  
  // Default to 0 only if we need a number, but use undefined to indicate missing data
  // For display purposes, we'll check for > 0, so undefined works fine

  // Bathrooms - handle string or number, only set if > 0
  let bathrooms: number = 0;
  if (apiProperty.bathrooms !== undefined && apiProperty.bathrooms !== null) {
    if (typeof apiProperty.bathrooms === 'string') {
      const trimmed = apiProperty.bathrooms.trim();
      if (trimmed !== '' && trimmed.toLowerCase() !== 'zero') {
        const parsed = parseInt(trimmed, 10);
        bathrooms = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
      }
    } else if (Array.isArray(apiProperty.bathrooms) && apiProperty.bathrooms.length > 0) {
      const firstValue = apiProperty.bathrooms[0];
      if (typeof firstValue === 'string') {
        const trimmed = firstValue.trim();
        if (trimmed !== '' && trimmed.toLowerCase() !== 'zero') {
          const parsed = parseInt(trimmed, 10);
          bathrooms = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
        }
      } else if (typeof firstValue === 'number' && firstValue > 0) {
        bathrooms = Math.floor(firstValue);
      }
    } else if (typeof apiProperty.bathrooms === 'number' && apiProperty.bathrooms > 0) {
      bathrooms = Math.floor(apiProperty.bathrooms);
    }
  } else if (apiProperty.min_bathrooms) {
    const minBathrooms = Array.isArray(apiProperty.min_bathrooms) 
      ? apiProperty.min_bathrooms[0] 
      : apiProperty.min_bathrooms;
    if (typeof minBathrooms === 'string') {
      const trimmed = minBathrooms.trim();
      if (trimmed !== '' && trimmed.toLowerCase() !== 'zero') {
        const parsed = parseInt(trimmed, 10);
        bathrooms = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
      }
    } else if (typeof minBathrooms === 'number' && minBathrooms > 0) {
      bathrooms = Math.floor(minBathrooms);
    }
  }

  // City - extract from API
  const city = apiProperty.city && typeof apiProperty.city === 'string' && apiProperty.city.trim() !== '' 
    ? apiProperty.city : undefined;

  // Locality - extract from API
  const locality = apiProperty.locality && typeof apiProperty.locality === 'string' && apiProperty.locality.trim() !== '' 
    ? apiProperty.locality : undefined;

  // Category - extract from API (Residential/Commercial)
  const category = apiProperty.category && typeof apiProperty.category === 'string' && apiProperty.category.trim() !== '' 
    ? apiProperty.category : undefined;

  // Location - combine multiple fields
  let location = apiProperty.location || '';
  if (!location) {
    const parts: string[] = [];
    if (apiProperty.locality) parts.push(apiProperty.locality);
    if (apiProperty.city) parts.push(apiProperty.city);
    if (apiProperty.address) parts.push(apiProperty.address);
    if (apiProperty.area_name) parts.push(apiProperty.area_name);
    location = parts.join(', ');
  }
  if (!location) {
    location = 'Location not specified';
  }

  // Developer - handle object or string, ensure it's a string
  let developer: string | undefined = undefined;
  if (apiProperty.developer) {
    if (typeof apiProperty.developer === 'string') {
      developer = apiProperty.developer.trim() !== '' ? apiProperty.developer : undefined;
    } else if (apiProperty.developer.name) {
      developer = typeof apiProperty.developer.name === 'string' 
        ? (apiProperty.developer.name.trim() !== '' ? apiProperty.developer.name : undefined)
        : String(apiProperty.developer.name || '').trim() !== '' ? String(apiProperty.developer.name) : undefined;
    }
  }
  // Also check developer_name field
  if (!developer && (apiProperty as any).developer_name) {
    const devName = (apiProperty as any).developer_name;
    developer = typeof devName === 'string' 
      ? (devName.trim() !== '' ? devName : undefined)
      : String(devName || '').trim() !== '' ? String(devName) : undefined;
  }

  // Images - check multiple possible fields
  let mainImage: string | null = null;
  let gallery: string[] = [];

  // Check for main_image field
  if (apiProperty.main_image && apiProperty.main_image.trim() !== '') {
    mainImage = apiProperty.main_image;
  }

  // Check for images array
  if (apiProperty.images && Array.isArray(apiProperty.images) && apiProperty.images.length > 0) {
    // Filter out empty strings
    const validImages = apiProperty.images.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
    
    if (validImages.length > 0) {
      // Use first image as main if no main_image
      if (!mainImage) {
        mainImage = validImages[0];
      }
      // Rest as gallery (excluding main image)
      gallery = validImages.filter((img: string) => img !== mainImage);
    }
  }

  // Check for gallery array
  if (apiProperty.gallery && Array.isArray(apiProperty.gallery) && apiProperty.gallery.length > 0) {
    const validGallery = apiProperty.gallery.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
    if (validGallery.length > 0) {
      gallery = [...gallery, ...validGallery.filter((img: string) => img !== mainImage)];
    }
  }

  // Check for image_urls or photo_urls
  if (!mainImage && (apiProperty as any).image_urls && Array.isArray((apiProperty as any).image_urls)) {
    const imageUrls = (apiProperty as any).image_urls.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
    if (imageUrls.length > 0) {
      mainImage = imageUrls[0];
      gallery = imageUrls.slice(1);
    }
  }

  // Use placeholder if no image is available
  const finalMainImage = mainImage && mainImage.trim() !== '' 
    ? mainImage 
    : 'https://via.placeholder.com/800x600?text=No+Image';

  // Amenities - ensure it's an array
  let amenities: string[] = [];
  if (apiProperty.amenities) {
    if (Array.isArray(apiProperty.amenities)) {
      amenities = apiProperty.amenities.filter((a: any) => a && (typeof a === 'string' || typeof a === 'object'));
      // If amenities are objects, extract names
      amenities = amenities.map((a: any) => typeof a === 'string' ? a : (a.name || a.title || String(a)));
    } else if (typeof apiProperty.amenities === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(apiProperty.amenities);
        amenities = Array.isArray(parsed) ? parsed : [];
      } catch {
        amenities = [apiProperty.amenities];
      }
    }
  }

  // Dates
  const createdAt = apiProperty.created_at || apiProperty.createdAt || apiProperty.created || undefined;
  const updatedAt = apiProperty.updated_at || apiProperty.updatedAt || apiProperty.updated || undefined;
  
  // Ready date / Handover year - ensure it's a string
  let readyDate: string | undefined = undefined;
  if (apiProperty.ready_date) {
    readyDate = typeof apiProperty.ready_date === 'string' 
      ? apiProperty.ready_date 
      : String(apiProperty.ready_date);
  } else if (apiProperty.handover_year) {
    readyDate = String(apiProperty.handover_year);
  } else if (apiProperty.handover_date) {
    readyDate = typeof apiProperty.handover_date === 'string' 
      ? apiProperty.handover_date 
      : String(apiProperty.handover_date);
  } else if (apiProperty.completion_date) {
    readyDate = typeof apiProperty.completion_date === 'string' 
      ? apiProperty.completion_date 
      : String(apiProperty.completion_date);
  }

  // Listing type
  const listingType = apiProperty.listing_type || 
                      apiProperty.listingType || 
                      (apiProperty.category === 'rent' ? 'rent' : 'sale') ||
                      'sale';

  // Floors - handle number or string
  let floors: number | string | undefined = undefined;
  if (apiProperty.floors !== undefined && apiProperty.floors !== null) {
    if (typeof apiProperty.floors === 'string') {
      const parsed = parseInt(apiProperty.floors);
      floors = isNaN(parsed) ? apiProperty.floors : parsed;
    } else {
      floors = apiProperty.floors;
    }
  } else if ((apiProperty as any).num_floors) {
    floors = (apiProperty as any).num_floors;
  } else if ((apiProperty as any).floor_count) {
    floors = (apiProperty as any).floor_count;
  }

  // Security - handle boolean or string
  let security: boolean | string | undefined = undefined;
  if (apiProperty.security !== undefined && apiProperty.security !== null) {
    if (typeof apiProperty.security === 'boolean') {
      security = apiProperty.security;
    } else if (typeof apiProperty.security === 'string') {
      const lower = apiProperty.security.toLowerCase();
      security = lower === 'true' || lower === 'yes' || lower === '1' ? true : 
                 lower === 'false' || lower === 'no' || lower === '0' ? false : 
                 apiProperty.security;
    }
  } else if ((apiProperty as any).has_security) {
    security = (apiProperty as any).has_security;
  } else if ((apiProperty as any).security_available) {
    security = (apiProperty as any).security_available;
  }

  // Furnished - ensure it's a string
  let furnished: string | undefined = undefined;
  const furnishedValue = apiProperty.furnished || (apiProperty as any).furnishing;
  if (furnishedValue !== undefined && furnishedValue !== null) {
    furnished = typeof furnishedValue === 'string' 
      ? (furnishedValue.trim() !== '' ? furnishedValue : undefined)
      : String(furnishedValue).trim() !== '' ? String(furnishedValue) : undefined;
  }

  // Payment plan - ensure it's a string
  let paymentPlan: string | undefined = undefined;
  const paymentPlanValue = apiProperty.payment_plan || (apiProperty as any).payment_plan_name;
  if (paymentPlanValue !== undefined && paymentPlanValue !== null) {
    paymentPlan = typeof paymentPlanValue === 'string' 
      ? (paymentPlanValue.trim() !== '' ? paymentPlanValue : undefined)
      : String(paymentPlanValue).trim() !== '' ? String(paymentPlanValue) : undefined;
  }

  const minPrice = apiProperty.min_price ?? apiProperty.price_range?.min;
  const maxPrice = apiProperty.max_price ?? apiProperty.price_range?.max;

  // Build the return object, only including fields with valid values
  const property: Property = {
    id,
    slug: apiProperty.slug || undefined,
    title,
    description,
    type,
    price,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice && maxPrice !== minPrice ? Number(maxPrice) : undefined,
    location,
    city,
    locality,
    category,
    developer: developer || undefined,
    amenities,
    mainImage: finalMainImage,
    gallery,
    createdAt,
    updatedAt,
    readyDate,
    listingType: listingType as 'sale' | 'rent',
  };

  // Only add area if it's a valid number > 0
  if (area !== undefined && area > 0) {
    property.area = area;
  }
  
  // Add area range (min/max)
  if (areaMin !== undefined && areaMin > 0) {
    property.areaMin = areaMin;
  }
  if (areaMax !== undefined && areaMax > 0) {
    property.areaMax = areaMax;
  }

  // Only add bedrooms if it's a valid number > 0
  if (bedrooms !== undefined && bedrooms > 0) {
    property.bedrooms = bedrooms;
  }

  // Only add bathrooms if it's a valid number > 0
  if (bathrooms !== undefined && bathrooms > 0) {
    property.bathrooms = bathrooms;
  }

  // Only add optional fields if they have valid values
  if (floors !== undefined && floors !== null) {
    property.floors = floors;
  }
  if (security !== undefined && security !== null) {
    property.security = security;
  }
  if (furnished !== undefined) {
    property.furnished = furnished;
  }
  if (paymentPlan !== undefined) {
    property.paymentPlan = paymentPlan;
  }

  // ROI data - only map from API response if provided
  if (apiProperty.roi && typeof apiProperty.roi === 'object') {
    const roiData = apiProperty.roi as { firstYear?: number; thirdYear?: number; fifthYear?: number };
    if (roiData.firstYear !== undefined || roiData.thirdYear !== undefined || roiData.fifthYear !== undefined) {
      property.roi = {
        firstYear: roiData.firstYear ?? 0,
        thirdYear: roiData.thirdYear ?? 0,
        fifthYear: roiData.fifthYear ?? 0,
      };
    }
  }

  // Alnair API specific fields
  if (apiProperty.slug) {
    property.slug = apiProperty.slug;
  }
  if (apiProperty.latitude && !isNaN(parseFloat(String(apiProperty.latitude)))) {
    property.latitude = parseFloat(String(apiProperty.latitude));
  }
  if (apiProperty.longitude && !isNaN(parseFloat(String(apiProperty.longitude)))) {
    property.longitude = parseFloat(String(apiProperty.longitude));
  }
  if (apiProperty.construction_percent !== undefined && apiProperty.construction_percent !== null) {
    property.constructionPercent = typeof apiProperty.construction_percent === 'number' 
      ? apiProperty.construction_percent 
      : parseFloat(String(apiProperty.construction_percent)) || 0;
  }
  if (apiProperty.total_units !== undefined && apiProperty.total_units > 0) {
    property.totalUnits = apiProperty.total_units;
  }
  if (apiProperty.agent_fee !== undefined && apiProperty.agent_fee !== null) {
    property.agentFee = typeof apiProperty.agent_fee === 'number' 
      ? apiProperty.agent_fee 
      : parseFloat(String(apiProperty.agent_fee)) || 0;
  }
  if (apiProperty.project_badges && Array.isArray(apiProperty.project_badges) && apiProperty.project_badges.length > 0) {
    property.projectBadges = apiProperty.project_badges;
  }
  if (apiProperty.sales_status && Array.isArray(apiProperty.sales_status) && apiProperty.sales_status.length > 0) {
    property.salesStatus = apiProperty.sales_status;
  }

  return property;
}

export interface FilterOptions {
  type?: string | string[];
  category?: string;
  developer?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  city?: string;
  locality?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'min_price' | 'max_price';
  sortOrder?: 'asc' | 'desc';
}

// Convert FilterOptions to ApiFilterOptions for API calls
async function convertToApiFilters(filters: FilterOptions): Promise<ApiFilterOptions> {
  const apiFilters: ApiFilterOptions = {};
  
  // Property Type filter - DON'T SEND to backend
  // Backend has Prisma bug: it wraps single string in array and uses hasSome on enum field
  // This causes 500 error: "Invalid value for argument `hasSome`. Expected Type."
  // Workaround: Filter client-side instead of sending to backend
  // This avoids the backend Prisma enum issue entirely
  
  // Category filter - DON'T SEND to backend
  // Backend has Prisma bug: it wraps single string in array and uses `in` on enum field
  // This causes 500 error: "Invalid value for argument `in`. Expected Category."
  // Workaround: Filter client-side instead of sending to backend
  
  // Developer filter - use developer_id if available
  // Try to convert developer name to developer_id for API filtering (Alnair uses numeric IDs)
  if (filters.developer && typeof filters.developer === 'string' && filters.developer.trim() !== '') {
    const developerId = await getDeveloperIdByNameAsync(filters.developer.trim());
    if (developerId) {
      apiFilters.developer_id = developerId;
    } else {
      // Fallback to search if developer ID not found
      apiFilters.search = filters.developer.trim();
    }
  }
  
  // City filter - only send if not empty
  if (filters.city && typeof filters.city === 'string' && filters.city.trim() !== '') {
    apiFilters.city = filters.city.trim();
  }
  
  // Locality filter (more specific than city) - only send if not empty
  if (filters.locality && typeof filters.locality === 'string' && filters.locality.trim() !== '') {
    apiFilters.locality = filters.locality.trim();
  }
  
  // Price range filters - only send if > 0
  if (filters.minPrice && filters.minPrice > 0) {
    apiFilters.min_price = filters.minPrice;
  }
  
  if (filters.maxPrice && filters.maxPrice > 0) {
    apiFilters.max_price = filters.maxPrice;
  }
  
  // Area/Size range filters - only send if > 0
  if (filters.minArea && filters.minArea > 0) {
    apiFilters.min_sq_ft = filters.minArea;
  }
  
  if (filters.maxArea && filters.maxArea > 0) {
    apiFilters.max_sq_ft = filters.maxArea;
  }
  
  // Bedrooms filter - convert number to enum array
  // API expects array of enum strings: ["One", "Two", "Three", etc.]
  if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
    const bedroomEnumMap: { [key: number]: string } = {
      1: "One",
      2: "Two",
      3: "Three",
      4: "Four",
      5: "Five",
      6: "Six",
      7: "Seven",
    };
    const enumValue = bedroomEnumMap[filters.bedrooms];
    if (enumValue) {
      apiFilters.min_bedrooms = [enumValue];
      if (process.env.NODE_ENV === 'development') {
        console.log('API filters: Using min_bedrooms', apiFilters.min_bedrooms);
      }
    }
  }
  
  // Sort options - only send if defined
  if (filters.sortBy) {
    apiFilters.sort_by = filters.sortBy;
  }
  
  if (filters.sortOrder) {
    apiFilters.sort_order = filters.sortOrder;
  }
  
  // Search term - only include actual search text
  if (filters.search && filters.search.trim() !== '') {
    apiFilters.search = filters.search.trim();
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Converting Filters ===');
    console.log('Input filters:', filters);
    console.log('API filters:', apiFilters);
  }
  
  return apiFilters;
}

// Note: getAllProperties fetches without filters (used for related properties, etc.)
// For filtered results, use getPaginatedProperties which uses API-based filtering

// Fetch all properties from API (without filters - used for related properties)
export async function getAllProperties(page: number = 1, limit: number = 100): Promise<Property[]> {
  try {
    // Fetch all properties without any filters
    // Note: API has a max limit, so we use 100 which is typically accepted
    const response = await fetchProperties({}, page, limit);
    
    if (response.success && response.data) {
      return response.data.map(mapApiPropertyToProperty);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

// Fetch project description, amenities, and payment plan from Alnair look API
export interface ProjectLookData {
  description: string;
  amenities: string[];
  paymentPlan: string | null;
}
async function fetchProjectLookData(slug: string): Promise<ProjectLookData> {
  try {
    const base = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000';
    const url = typeof window !== 'undefined' ? `/api/project/look/${encodeURIComponent(slug)}` : `${base || 'http://localhost:3000'}/api/project/look/${encodeURIComponent(slug)}`;
    const response = await fetch(url);
    if (!response.ok) return { description: '', amenities: [], paymentPlan: null };
    const result = await response.json();
    const data = result?.data;
    const paymentPlan =
      (typeof data?.payment_plan === 'string' && data.payment_plan.trim()) || null;
    return {
      description: data?.description || '',
      amenities: Array.isArray(data?.amenities) ? data.amenities : [],
      paymentPlan: paymentPlan || null,
    };
  } catch {
    return { description: '', amenities: [], paymentPlan: null };
  }
}
/** @deprecated Use fetchProjectLookData for description + amenities */
async function fetchProjectDescription(slug: string): Promise<string> {
  const { description } = await fetchProjectLookData(slug);
  return description;
}

// Map static API project to Property format
function mapStaticProjectToProperty(data: any): Property {
  const gallery = data.gallery || [];
  const mainImage = data.mainImage || data.main_image || gallery[0] || '';
  const minPrice = data.minPrice ?? data.price;
  const maxPrice = data.maxPrice ?? data.price;
  const price = minPrice || maxPrice || 0;
  const amenities = Array.isArray(data.amenities) ? data.amenities.filter((a: unknown) => typeof a === 'string' && a.trim()) : [];
  return {
    id: data.id,
    slug: data.slug,
    title: data.title || 'Untitled',
    description: data.description || '',
    type: data.type || 'Off-Plan',
    price,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice && maxPrice !== minPrice ? maxPrice : undefined,
    mainImage: mainImage,
    gallery: gallery,
    location: data.location || data.locality || '',
    city: data.city || 'Dubai',
    locality: data.locality || data.location || '',
    developer: typeof data.developer === 'string' ? data.developer : data.developer?.name || '',
    readyDate: data.readyDate || null,
    amenities,
  };
}

// Fetch property by ID - uses all_data + look API for description
export async function getPropertyById(id: string | number): Promise<Property | null> {
  const idStr = typeof id === 'number' ? id.toString() : String(id);

  try {
    // 1. Try static API (all_data.json) first
    const base = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000';
    const staticUrl = typeof window !== 'undefined' ? `/api/project/static/${encodeURIComponent(idStr)}` : `${base || 'http://localhost:3000'}/api/project/static/${encodeURIComponent(idStr)}`;
    const staticRes = await fetch(staticUrl);

    if (staticRes.ok) {
      const staticResult = await staticRes.json();
      const baseData = staticResult?.data;
      if (baseData) {
        const slug = baseData.slug;
        let description = '';
        let amenities: string[] = [];
        let lookData: ProjectLookData | null = null;
        if (slug) {
          lookData = await fetchProjectLookData(slug);
          description = lookData.description;
          amenities = lookData.amenities.length > 0 ? await translateAmenities(lookData.amenities) : lookData.amenities;
        }
        const property = mapStaticProjectToProperty({
          ...baseData,
          description: description || baseData.description || '',
          amenities: amenities.length > 0 ? amenities : (baseData.amenities || []),
        });
        if (amenities.length > 0) property.amenities = amenities;
        if (lookData?.paymentPlan) property.paymentPlan = lookData.paymentPlan;
        return property;
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('Static API fallback:', e);
  }

  // 2. Fallback to existing API
  try {
    const apiProperty = await fetchPropertyByIdApi(idStr);
    if (apiProperty) {
      const property = mapApiPropertyToProperty(apiProperty);
      const slug = property.slug || (typeof apiProperty.slug === 'string' ? apiProperty.slug : null);
      if (slug) {
        const lookData = await fetchProjectLookData(slug);
        if (lookData.description) property.description = lookData.description;
        if (lookData.amenities.length > 0) property.amenities = await translateAmenities(lookData.amenities);
        if (lookData.paymentPlan) property.paymentPlan = lookData.paymentPlan;
      }
      return property;
    }
  } catch (error) {
    console.error('Error fetching property by ID:', error);
  }

  return null;
}

// Fetch related properties
export async function getRelatedProperties(
  excludeId: string | number,
  type?: string,
  limit: number = 4
): Promise<Property[]> {
  try {
    // Fetch all properties
    const properties = await getAllProperties(1, 100);
    const excludeIdStr = typeof excludeId === 'number' ? excludeId.toString() : excludeId;
    
    // Filter client-side: exclude current property and optionally filter by type
    const filtered = properties
      .filter((p) => {
        const pId = typeof p.id === 'number' ? p.id.toString() : p.id;
        if (pId === excludeIdStr) return false;
        if (type && p.type?.toLowerCase() !== type.toLowerCase()) return false;
        return true;
      })
      .slice(0, limit);
    
    return await translatePropertiesForDisplay(filtered);
  } catch (error) {
    console.error('Error fetching related properties:', error);
    return [];
  }
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 1000000000) {
    const bValue = (price / 1000000000).toFixed(2);
    return `${parseFloat(bValue).toLocaleString('en-US')}B`;
  } else if (price >= 1000000) {
    const mValue = (price / 1000000).toFixed(2);
    return `${parseFloat(mValue).toLocaleString('en-US')}M`;
  } else if (price >= 1000) {
    const kValue = (price / 1000).toFixed(0);
    return `${parseInt(kValue).toLocaleString('en-US')}K`;
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format date string to readable format (handover/delivery dates on homepage and property page)
export function formatDate(dateString: string | number | undefined | null): string {
  if (dateString === undefined || dateString === null) {
    return 'TBA';
  }
  // Allow number (e.g. year 2030)
  if (typeof dateString === 'number') {
    return String(dateString);
  }
  if (typeof dateString !== 'string' || dateString.trim() === '') {
    return 'TBA';
  }

  try {
    const trimmed = dateString.trim();
    
    // Year only (4 digits)
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Quarter format e.g. "Q1 2030", "Q4 2026", "Q2 2028" – return as-is to avoid Invalid Date
    if (/^Q[1-4]\s*\d{4}$/i.test(trimmed)) {
      return trimmed.replace(/\s+/g, ' ').trim();
    }
    
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      return trimmed;
    }
    
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    // Never show "Invalid Date" (e.g. if toLocaleDateString misbehaves)
    return formatted === 'Invalid Date' ? trimmed : formatted;
  } catch {
    return dateString.trim() || 'TBA';
  }
}

// Filter properties (DEPRECATED - Now using API-based filtering)
// This function is kept for backward compatibility but should not be used in new code
// All filtering should be done via API in getPaginatedProperties which uses convertToApiFilters
export function filterProperties(properties: Property[], filters: FilterOptions): Property[] {
  return properties.filter((property) => {
    // Search filter - search in title, description, location, and type
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase().trim();
      const titleMatch = property.title?.toLowerCase().includes(searchLower) || false;
      const descMatch = property.description?.toLowerCase().includes(searchLower) || false;
      const locationMatch = property.location?.toLowerCase().includes(searchLower) || false;
      const typeMatch = property.type?.toLowerCase().includes(searchLower) || false;
      const developerMatch = property.developer?.toLowerCase().includes(searchLower) || false;
      
      if (!titleMatch && !descMatch && !locationMatch && !typeMatch && !developerMatch) {
        return false;
      }
    }
    
    // Type filter - handle both string and string[] cases
    if (filters.type) {
      const typeFilter = Array.isArray(filters.type) ? filters.type : [filters.type];
      const hasMatchingType = typeFilter.some(
        filterType => filterType.trim() !== '' && 
        property.type?.toLowerCase() === filterType.toLowerCase()
      );
      if (!hasMatchingType) {
        return false;
      }
    }
    
    // Bedrooms filter - filter for properties with AT LEAST the specified number of bedrooms
    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
      if (!property.bedrooms || property.bedrooms < filters.bedrooms) {
        return false;
      }
    }
    
    // Price filters
    const propertyPrice = typeof property.price === 'number' ? property.price : 0;
    
    // Min price filter - exclude properties below minimum
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      if (propertyPrice < filters.minPrice) {
        return false;
      }
    }
    
    // Max price filter - exclude properties above maximum
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      if (propertyPrice > filters.maxPrice) {
        return false;
      }
    }
    
    // City filter
    if (filters.city && filters.city.trim() !== '') {
      // Check if location contains the city name
      if (!property.location || !property.location.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}

// Fetch properties with pagination
export interface PaginatedPropertiesResult {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cache for all properties to avoid refetching on every page change
let cachedProperties: Property[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Dedupe by canonical project name (e.g. "Azizi Venice 1", "Azizi Venice 2" -> keep one)
function dedupeByCanonicalTitle(properties: Property[]): Property[] {
  const canonical = (t: string) => (t || '').replace(/\s+\d+$/, '').trim().toLowerCase() || (t || '').toLowerCase();
  const seen = new Set<string>();
  return properties.filter((p) => {
    const can = canonical(p.title || '');
    if (seen.has(can)) return false;
    seen.add(can);
    return true;
  });
}

/** Translate Arabic title/location/developer/description/locality/amenities to English for list/card display */
async function translatePropertiesForDisplay(properties: Property[]): Promise<Property[]> {
  if (!properties.length) return properties;
  const stringsToTranslate = new Set<string>();
  for (const p of properties) {
    if (p.title && containsArabic(p.title)) stringsToTranslate.add(p.title);
    if (p.location && containsArabic(p.location)) stringsToTranslate.add(p.location);
    if (p.developer && containsArabic(p.developer)) stringsToTranslate.add(p.developer);
    if (p.description && containsArabic(p.description)) stringsToTranslate.add(p.description);
    if (p.locality && containsArabic(p.locality)) stringsToTranslate.add(p.locality);
    if (Array.isArray(p.amenities)) {
      p.amenities.forEach((a) => { if (a && typeof a === 'string' && containsArabic(a)) stringsToTranslate.add(a.trim()); });
    }
  }
  const translationCache: Record<string, string> = {};
  if (stringsToTranslate.size > 0) {
    await Promise.all(
      Array.from(stringsToTranslate).map(async (str) => {
        const translated = await translateToEnglish(str);
        translationCache[str] = translated;
      })
    );
  }
  return properties.map((p) => ({
    ...p,
    title: (p.title && translationCache[p.title]) || p.title,
    location: (p.location && translationCache[p.location]) || p.location,
    developer: (p.developer && translationCache[p.developer]) || p.developer,
    description: (p.description && translationCache[p.description]) || p.description,
    locality: (p.locality && translationCache[p.locality]) || p.locality,
    amenities: Array.isArray(p.amenities)
      ? p.amenities.map((a) => (a && typeof a === 'string' && translationCache[a.trim()]) ? translationCache[a.trim()] : a)
      : p.amenities,
  }));
}

// Fetch paginated properties from all_data.json (static API)
async function getPaginatedPropertiesFromStatic(
  filters: FilterOptions = {},
  page: number = 1,
  limit: number = 9
): Promise<PaginatedPropertiesResult> {
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filters.locality) params.set('locality', filters.locality);
    if (filters.search) params.set('search', filters.search);
    if (filters.developer) params.set('developer', filters.developer);
    if (filters.minPrice && filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice && filters.maxPrice > 0) params.set('maxPrice', String(filters.maxPrice));

    const url = `/api/projects/static?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Static API error: ${response.status}`);
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      return { properties: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }

    const rawItems = result.data;
    const pagination = result.pagination || { page: 1, limit, total: 0, totalPages: 0 };
    const properties = rawItems.map((d: any) => mapStaticProjectToProperty(d));
    return { properties, pagination };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('Static properties fetch failed:', e);
    throw e;
  }
}

export async function getPaginatedProperties(
  filters: FilterOptions = {},
  page: number = 1,
  limit: number = 9
): Promise<PaginatedPropertiesResult> {
  try {
    // Use static API only when NOT filtering by developer (static data has builder names in Arabic)
    const hasDeveloperFilter = !!(filters.developer && typeof filters.developer === 'string' && filters.developer.trim() !== '');
    if (!hasDeveloperFilter) {
      try {
        const result = await getPaginatedPropertiesFromStatic(filters, page, limit);
        result.properties = await translatePropertiesForDisplay(result.properties);
        return result;
      } catch {
        // Fall through to Alnair find API if static fails (e.g. all_data.json missing)
      }
    }

    const apiFilters = await convertToApiFilters(filters);
    const hasDeveloperId = !!(apiFilters.developer_id);
    
    // Check if we have valid cached properties (no filters applied)
    const hasFilters = !!(
      filters.type ||
      filters.category ||
      filters.search ||
      filters.city ||
      filters.locality ||
      filters.developer ||
      (filters.bedrooms !== undefined && filters.bedrooms > 0) ||
      (filters.minPrice !== undefined && filters.minPrice > 0) ||
      (filters.maxPrice !== undefined && filters.maxPrice > 0) ||
      (filters.minArea !== undefined && filters.minArea > 0) ||
      (filters.maxArea !== undefined && filters.maxArea > 0)
    );
    
    const now = Date.now();
    const cacheValid = cachedProperties && (now - cacheTimestamp) < CACHE_DURATION;
    
    // Use cached properties if available and no filters applied
    if (!hasFilters && cacheValid && cachedProperties) {
      const total = cachedProperties.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProperties = cachedProperties.slice(startIndex, endIndex);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Using Cached Properties ===');
        console.log('Total cached:', total);
        console.log('Page:', page, 'of', totalPages);
        console.log('Showing:', paginatedProperties.length, 'properties');
      }
      
      const translated = await translatePropertiesForDisplay(paginatedProperties);
      return {
        properties: translated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }
    
    const needsClientSideFiltering = !!(
      filters.type ||
      filters.category ||
      filters.locality ||
      filters.city ||
      (filters.bedrooms !== undefined && filters.bedrooms > 0) ||
      (filters.developer && typeof filters.developer === 'string' && filters.developer.trim() !== '' && !hasDeveloperId)
    );
    
    // If we need client-side filtering, fetch ALL properties by paginating through API
    // Backend has a max limit of 100, so we need to fetch multiple pages
    if (needsClientSideFiltering) {
      const maxLimit = 100; // Backend max limit
      let allProperties: Property[] = [];
      let currentFetchPage = 1;
      let hasMore = true;
      
      // Fetch all pages
      while (hasMore) {
        const response = await fetchProperties(apiFilters, currentFetchPage, maxLimit);
        
        if (response.success && response.data && response.data.length > 0) {
          const mappedProperties = response.data.map(mapApiPropertyToProperty);
          allProperties = [...allProperties, ...mappedProperties];
          
          // Check if there are more pages
          const totalFromApi = response.pagination?.total || 0;
          const fetchedSoFar = currentFetchPage * maxLimit;
          hasMore = fetchedSoFar < totalFromApi && response.data.length === maxLimit;
          currentFetchPage++;
          
          // Safety limit to prevent infinite loops
          if (currentFetchPage > 20) {
            console.warn('Reached max page limit (20) for client-side filtering');
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${allProperties.length} total properties for client-side filtering`);
        const uniqueTypes = [...new Set(allProperties.map(p => p.type).filter(Boolean))];
        const uniqueCategories = [...new Set(allProperties.map(p => p.category).filter(Boolean))];
        console.log('=== Available Property Values ===');
        console.log('Unique types in data:', uniqueTypes);
        console.log('Unique categories in data:', uniqueCategories);
        console.log('Filter type:', filters.type);
        console.log('Filter category:', filters.category);
      }
      
      // Now apply client-side filtering to all properties
      let properties = allProperties;
      
      // Type filter - flexible matching (contains, case-insensitive)
      if (filters.type) {
        const typeFilter = Array.isArray(filters.type) 
          ? filters.type.map(t => typeof t === 'string' ? t.toLowerCase().trim() : String(t).toLowerCase().trim())
          : [typeof filters.type === 'string' ? filters.type.toLowerCase().trim() : String(filters.type).toLowerCase().trim()];
        
        const beforeCount = properties.length;
        properties = properties.filter((p) => {
          const propertyType = (p.type || '').toLowerCase().trim();
          // Check for exact match or contains match
          return typeFilter.some(filterType => 
            propertyType === filterType || 
            propertyType.includes(filterType) || 
            filterType.includes(propertyType)
          );
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Type filter: ${beforeCount} -> ${properties.length} properties`);
        }
      }
      
      // Bedrooms filter
      if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
        const beforeCount = properties.length;
        properties = properties.filter((p) => {
          return p.bedrooms !== undefined && p.bedrooms >= filters.bedrooms!;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Bedrooms filter (>= ${filters.bedrooms}): ${beforeCount} -> ${properties.length} properties`);
        }
      }
      
      // Developer filter (only if developer_id was not available - fallback to client-side)
      if (filters.developer && typeof filters.developer === 'string' && filters.developer.trim() !== '' && !hasDeveloperId) {
        const developerFilter = filters.developer.trim().toLowerCase();
        const beforeCount = properties.length;
        properties = properties.filter((p) => {
          const propertyDeveloper = (p.developer || '').toLowerCase();
          return propertyDeveloper.includes(developerFilter) || propertyDeveloper === developerFilter;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Developer filter (client-side fallback, ${developerFilter}): ${beforeCount} -> ${properties.length} properties`);
        }
      }
      
      // Category filter - flexible matching (contains, case-insensitive)
      if (filters.category && typeof filters.category === 'string' && filters.category.trim() !== '') {
        const categoryFilter = filters.category.trim().toLowerCase();
        const beforeCount = properties.length;
        properties = properties.filter((p) => {
          const propertyCategory = (p.category || '').toLowerCase().trim();
          // Check for exact match or contains match
          return propertyCategory === categoryFilter || 
                 propertyCategory.includes(categoryFilter) || 
                 categoryFilter.includes(propertyCategory);
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Category filter (${categoryFilter}): ${beforeCount} -> ${properties.length} properties`);
        }
      }
      
      // Locality filter - filter by district/area name (client-side only, API doesn't support)
      if (filters.locality && typeof filters.locality === 'string' && filters.locality.trim() !== '') {
        const localityFilter = filters.locality.trim().toLowerCase();
        const beforeCount = properties.length;
        
        if (process.env.NODE_ENV === 'development') {
          // Show all unique locality values to help debug
          const uniqueLocalities = [...new Set(properties.map(p => p.locality).filter(Boolean))];
          console.log('=== Locality Filter Debug ===');
          console.log('Filter value:', localityFilter);
          console.log('Total properties before filter:', beforeCount);
          console.log('Unique locality values in data:', uniqueLocalities.slice(0, 20));
          console.log('Sample properties:', properties.slice(0, 3).map(p => ({
            title: p.title,
            locality: p.locality,
            location: p.location
          })));
        }
        
        properties = properties.filter((p) => {
          const propertyLocality = (p.locality || '').toLowerCase().trim();
          const propertyLocation = (p.location || '').toLowerCase().trim();
          // Check locality field first, then fall back to location field
          // Support exact match, contains match, and reverse contains
          const matches = propertyLocality === localityFilter || 
                         propertyLocality.includes(localityFilter) || 
                         localityFilter.includes(propertyLocality) ||
                         propertyLocation === localityFilter ||
                         propertyLocation.includes(localityFilter) ||
                         localityFilter.includes(propertyLocation);
          
          if (matches && process.env.NODE_ENV === 'development') {
            console.log(`✓ Matched: ${p.title} (locality: "${p.locality}", location: "${p.location}")`);
          }
          
          return matches;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Locality filter result: ${beforeCount} -> ${properties.length} properties`);
          if (properties.length === 0) {
            console.warn('⚠️ No properties matched! Check if locality values match the filter.');
          }
        }
      }
      
      // City filter - filter by city name in location field (client-side only when needed)
      if (filters.city && typeof filters.city === 'string' && filters.city.trim() !== '') {
        const cityFilter = filters.city.trim().toLowerCase();
        const beforeCount = properties.length;
        properties = properties.filter((p) => {
          const propertyCity = (p.city || p.location || '').toLowerCase().trim();
          // Check for exact match or contains match
          return propertyCity === cityFilter || 
                 propertyCity.includes(cityFilter) || 
                 cityFilter.includes(propertyCity);
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`City filter (${cityFilter}): ${beforeCount} -> ${properties.length} properties`);
        }
      }
      
      // Dedupe by canonical project name (e.g. Azizi Venice 1, 2, ... 16 -> one Azizi Venice)
      properties = dedupeByCanonicalTitle(properties);
      
      // Calculate pagination from filtered results
      const total = properties.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProperties = properties.slice(startIndex, endIndex);
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Client-Side Filtering Complete ===');
        console.log('Filters applied:', filters);
        console.log('Total after filtering:', total);
        console.log('Page:', page, 'of', totalPages);
        console.log('Showing:', paginatedProperties.length, 'properties');
      }
      
      const translated = await translatePropertiesForDisplay(paginatedProperties);
      return {
        properties: translated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }
    
    // No client-side filtering needed - fetch all properties and paginate client-side
    // This ensures proper pagination since Alnair API may have different pagination behavior
    // Alnair API returns 30 items per page by default, 77 pages total (~2282 properties)
    const apiLimit = 100; // Request 100 per page to minimize API calls
    let allProperties: Property[] = [];
    
    // If we have cached properties and no filters, use cache
    if (!hasFilters && cacheValid && cachedProperties) {
      allProperties = cachedProperties;
    } else {
      // Fetch all properties by paginating through API
      let currentApiPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetchProperties(apiFilters, currentApiPage, apiLimit);
        
        if (response.success && response.data && response.data.length > 0) {
          const mappedProperties = response.data.map(mapApiPropertyToProperty);
          allProperties = [...allProperties, ...mappedProperties];
          
          // Check if there are more pages
          const totalFromApi = response.pagination?.total || 0;
          const totalPagesFromApi = response.pagination?.total_pages || 0;
          hasMore = currentApiPage < totalPagesFromApi && response.data.length > 0;
          currentApiPage++;
          
          // Log progress
          if (process.env.NODE_ENV === 'development') {
            console.log(`Fetched page ${currentApiPage - 1}/${totalPagesFromApi}: ${mappedProperties.length} properties (total so far: ${allProperties.length}/${totalFromApi})`);
          }
          
          // Safety limit to prevent infinite loops (Alnair has ~77 pages)
          if (currentApiPage > 100) {
            console.warn('Reached max API page limit (100)');
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      // Cache the results if no filters applied
      if (!hasFilters && allProperties.length > 0) {
        cachedProperties = allProperties;
        cacheTimestamp = Date.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Cached ${allProperties.length} properties`);
        }
      }
    }
    
    // Dedupe by canonical project name
    allProperties = dedupeByCanonicalTitle(allProperties);
    
    if (allProperties.length > 0) {
      const total = allProperties.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProperties = allProperties.slice(startIndex, endIndex);
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Client-Side Pagination ===');
        console.log('Filters applied:', filters);
        console.log('Total properties:', total);
        console.log('Page:', page, 'of', totalPages);
        console.log('Showing:', paginatedProperties.length, 'properties');
      }
      
      const translated = await translatePropertiesForDisplay(paginatedProperties);
      return {
        properties: translated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }
    
    return {
      properties: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching paginated properties:', error);
    return {
      properties: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
