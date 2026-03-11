import { containsArabic, translateToEnglish, translateAmenities } from '@/lib/translate';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000';
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
  /** Range of bedrooms offered (e.g. "Studio – 2" or "1 – 3") from project units (111=1BR, 112=2BR, etc.). */
  bedroomRange?: string | null;
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
  paymentPlanBreakdown?: {
    onBooking?: number;
    onConstruction?: number;
    onHandover?: number;
    postHandover?: number;
  };
  /** Structured phases: on booking, on construction, on handover, post handover (from API). */
  paymentPlanSections?: {
    on_booking?: string | number;
    on_construction?: string | number;
    on_handover?: string | number;
    post_handover?: string | number;
  };
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

export interface FilterOptions {
  type?: string | string[];
  category?: string;
  developer?: string;
  /** When set (e.g. Luxury view), only show properties from these developers (case-insensitive partial match) */
  allowedDevelopers?: string[];
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

// Fetch all properties from static API (used for related properties, etc.)
export async function getAllProperties(page: number = 1, limit: number = 100): Promise<Property[]> {
  try {
    const base = getBaseUrl();
    const url = typeof window !== 'undefined'
      ? `/api/projects/static?page=${page}&limit=${limit}`
      : `${base || 'http://localhost:3000'}/api/projects/static?page=${page}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) return [];
    return result.data.map((d: any) => mapStaticProjectToProperty(d));
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
  paymentPlanBreakdown: {
    onBooking?: number;
    onConstruction?: number;
    onHandover?: number;
    postHandover?: number;
  } | null;
  paymentPlanSections?: {
    on_booking?: string | number;
    on_construction?: string | number;
    on_handover?: string | number;
    post_handover?: string | number;
  } | null;
}
async function fetchProjectLookData(slug: string): Promise<ProjectLookData> {
  try {
    const base = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000';
    const url = typeof window !== 'undefined' ? `/api/project/look/${encodeURIComponent(slug)}` : `${base || 'http://localhost:3000'}/api/project/look/${encodeURIComponent(slug)}`;
    const response = await fetch(url);
    if (!response.ok) return { description: '', amenities: [], paymentPlan: null, paymentPlanBreakdown: null };
    const result = await response.json();
    const data = result?.data;
    const paymentPlan =
      (typeof data?.payment_plan === 'string' && data.payment_plan.trim()) || null;
    const paymentPlanBreakdown = data?.payment_plan_breakdown ?? null;
    const paymentPlanSections = data?.payment_plan_sections && typeof data.payment_plan_sections === 'object' ? data.payment_plan_sections : null;
    const rawAmenities = Array.isArray(data?.amenities) ? data.amenities : [];
    const amenities: string[] = rawAmenities.map((a: unknown) =>
      a && typeof a === 'object' && 'label' in (a as object) && typeof (a as { label: string }).label === 'string'
        ? (a as { label: string }).label
        : String(a ?? '')
    ).filter(Boolean);
    return {
      description: data?.description || '',
      amenities,
      paymentPlan: paymentPlan || null,
      paymentPlanBreakdown: paymentPlanBreakdown || null,
      paymentPlanSections: paymentPlanSections || null,
    };
  } catch {
    return { description: '', amenities: [], paymentPlan: null, paymentPlanBreakdown: null };
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
  const prop: Property = {
    id: data.id,
    slug: data.slug,
    title: data.title || 'Untitled',
    description: data.description || '',
    type: data.type || 'Off-Plan',
    category: data.category || undefined,
    price,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice && maxPrice !== minPrice ? maxPrice : undefined,
    mainImage: mainImage || 'https://via.placeholder.com/800x600?text=No+Image',
    gallery: gallery,
    location: data.location || data.locality || '',
    city: data.city || 'Dubai',
    locality: data.locality || data.location || '',
    developer: typeof data.developer === 'string' ? data.developer : data.developer?.name || '',
    readyDate: data.readyDate || undefined,
    amenities,
  };
  if (data.latitude != null && !isNaN(Number(data.latitude))) prop.latitude = Number(data.latitude);
  if (data.longitude != null && !isNaN(Number(data.longitude))) prop.longitude = Number(data.longitude);
  if (data.bedrooms !== undefined && typeof data.bedrooms === 'number' && data.bedrooms >= 0) prop.bedrooms = data.bedrooms;
  if (data.bedroomRange !== undefined && data.bedroomRange != null && String(data.bedroomRange).trim()) prop.bedroomRange = String(data.bedroomRange).trim();
  return prop;
}

// Fetch property by ID - static API only. If not found or not UAE, returns null. No external lookup.
export async function getPropertyById(id: string | number): Promise<Property | null> {
  const idStr = typeof id === 'number' ? id.toString() : String(id);

  try {
    const base = getBaseUrl();
    const staticUrl = typeof window !== 'undefined'
      ? `/api/project/static/${encodeURIComponent(idStr)}`
      : `${base || 'http://localhost:3000'}/api/project/static/${encodeURIComponent(idStr)}`;
    const staticRes = await fetch(staticUrl);

    if (!staticRes.ok) return null;

    const staticResult = await staticRes.json();
    const baseData = staticResult?.data;
    if (!baseData) return null;

    const slug = baseData.slug;
    let description = '';
    let amenities: string[] = [];
    let lookData: ProjectLookData | null = null;
    if (slug) {
      lookData = await fetchProjectLookData(slug);
      description = lookData.description;
      if (description && containsArabic(description)) description = await translateToEnglish(description);
      // Amenities from look API are enum labels (already in display language)
      amenities = lookData.amenities;
    }
    const property = mapStaticProjectToProperty({
      ...baseData,
      description: description || baseData.description || '',
      amenities: amenities.length > 0 ? amenities : (baseData.amenities || []),
    });
    if (amenities.length > 0) property.amenities = amenities;
    if (lookData?.paymentPlan) property.paymentPlan = lookData.paymentPlan;
    if (lookData?.paymentPlanBreakdown) property.paymentPlanBreakdown = lookData.paymentPlanBreakdown;
    if (lookData?.paymentPlanSections) property.paymentPlanSections = lookData.paymentPlanSections;
    if (baseData.payment_plan_sections && typeof baseData.payment_plan_sections === 'object' && Object.keys(baseData.payment_plan_sections).length > 0) {
      property.paymentPlanSections = baseData.payment_plan_sections as Property['paymentPlanSections'];
    }
    return property;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('Static project fetch failed:', e);
    return null;
  }
}

// Fetch related properties (legacy — filter by type only)
export async function getRelatedProperties(
  excludeId: string | number,
  type?: string,
  limit: number = 4
): Promise<Property[]> {
  try {
    const properties = await getAllProperties(1, 100);
    const excludeIdStr = typeof excludeId === 'number' ? excludeId.toString() : excludeId;
    return properties
      .filter((p) => {
        const pId = typeof p.id === 'number' ? p.id.toString() : p.id;
        if (pId === excludeIdStr) return false;
        if (type && p.type?.toLowerCase() !== type.toLowerCase()) return false;
        return true;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching related properties:', error);
    return [];
  }
}

/** Score a candidate property for similarity to the current one (higher = more similar). */
function scoreSimilarity(current: Property, candidate: Property): number {
  let score = 0;
  const curPrice = current.minPrice ?? current.price;
  const candPrice = candidate.minPrice ?? candidate.price;
  const localityMatch = current.locality && candidate.locality &&
    String(current.locality).toLowerCase().trim() === String(candidate.locality).toLowerCase().trim();
  const developerMatch = current.developer && candidate.developer &&
    String(current.developer).toLowerCase().trim() === String(candidate.developer).toLowerCase().trim();
  const typeMatch = current.type && candidate.type &&
    String(current.type).toLowerCase() === String(candidate.type).toLowerCase();
  if (localityMatch) score += 3;
  if (developerMatch) score += 2;
  if (typeMatch) score += 1;
  if (curPrice > 0 && candPrice > 0) {
    const ratio = candPrice / curPrice;
    if (ratio >= 0.5 && ratio <= 1.5) score += 2;
    else if (ratio >= 0.3 && ratio <= 2) score += 1;
  }
  return score;
}

/** Suggested similar properties: scored by locality, developer, type, price range. */
export async function getSuggestedSimilarProperties(
  currentProperty: Property,
  limit: number = 6
): Promise<Property[]> {
  try {
    const properties = await getAllProperties(1, 150);
    const excludeIdStr = currentProperty.id != null ? String(currentProperty.id) : '';
    const scored = properties
      .filter((p) => {
        const pId = typeof p.id === 'number' ? p.id.toString() : p.id;
        return pId !== excludeIdStr && pId != null;
      })
      .map((p) => ({ property: p, score: scoreSimilarity(currentProperty, p) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.property);
    if (scored.length >= limit) return scored;
    const fallback = await getRelatedProperties(excludeIdStr, currentProperty.type, limit);
    const fallbackIds = new Set(scored.map((p) => (typeof p.id === 'number' ? p.id.toString() : p.id)));
    for (const p of fallback) {
      const id = typeof p.id === 'number' ? p.id.toString() : p.id;
      if (!fallbackIds.has(id)) { scored.push(p); fallbackIds.add(id); }
      if (scored.length >= limit) break;
    }
    return scored;
  } catch (error) {
    console.error('Error fetching suggested properties:', error);
    return getRelatedProperties(currentProperty.id ?? '', currentProperty.type, limit);
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

// Fetch paginated properties from static API (all_data.json). Forwards city and type to API.
async function getPaginatedPropertiesFromStatic(
  filters: FilterOptions = {},
  page: number = 1,
  limit: number = 9
): Promise<PaginatedPropertiesResult> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.city && String(filters.city).trim()) params.set('city', String(filters.city).trim());
  if (filters.type) {
    const t = Array.isArray(filters.type) ? filters.type[0] : filters.type;
    if (t && String(t).trim()) params.set('type', String(t).trim());
  }
  if (filters.locality) params.set('locality', filters.locality);
  if (filters.search) params.set('search', filters.search);
  if (filters.developer) params.set('developer', filters.developer);
  if (filters.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters.bedrooms !== undefined && filters.bedrooms > 0) params.set('bedrooms', String(filters.bedrooms));
  if (filters.minPrice && filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice && filters.maxPrice > 0) params.set('maxPrice', String(filters.maxPrice));

  const base = getBaseUrl();
  const url = typeof window !== 'undefined'
    ? `/api/projects/static?${params.toString()}`
    : `${base || 'http://localhost:3000'}/api/projects/static?${params.toString()}`;
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
}

export async function getPaginatedProperties(
  filters: FilterOptions = {},
  page: number = 1,
  limit: number = 9
): Promise<PaginatedPropertiesResult> {
  try {
    const result = await getPaginatedPropertiesFromStatic(filters, page, limit);
    return result;
  } catch (error) {
    console.error('Error fetching paginated properties:', error);
    return {
      properties: [],
      pagination: {
        page: 1,
        limit: limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

