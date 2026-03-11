/**
 * Shared helpers for static property data (all_data.json).
 * UAE-only filtering, city mapping, project type, descriptions cache.
 */

import path from 'path';
import fs from 'fs';
import { stripHtml } from '@/lib/descriptionParser';
import { extractAmenities } from '@/lib/descriptionParser/extractAmenities';

/** Allowed city IDs — only properties with these city_id values are visible. */
export const ALLOWED_CITY_IDS = new Set([1, 2, 3, 5, 7, 14, 52]);

/** Map city_id to city name (for display). */
export const CITY_ID_TO_NAME: Record<number, string> = {
  1: 'Dubai',
  2: 'Abu Dhabi',
  3: 'Sharjah',
  5: 'Ras Al Khaimah',
  7: 'Ajman',
  14: 'Umm Al Quwain',
  52: 'Fujairah',
};

const DEFAULT_CITY_NAME = 'Dubai';

export function getCityName(cityId: number | string | undefined | null): string {
  if (cityId == null) return DEFAULT_CITY_NAME;
  const id = typeof cityId === 'string' ? parseInt(cityId, 10) : cityId;
  if (isNaN(id)) return DEFAULT_CITY_NAME;
  return CITY_ID_TO_NAME[id] ?? DEFAULT_CITY_NAME;
}

/** Normalized city name (query param) to city_id. */
export const CITY_NAME_TO_ID: Record<string, number> = {
  'dubai': 1,
  'abu dhabi': 2,
  'sharjah': 3,
  'ajman': 7,
  'ras al khaimah': 5,
  'fujairah': 52,
  'umm al quwain': 14,
};

/** UAE bounding box. If property has lat/long, they must be inside this box. */
const UAE_LAT_MIN = 22.16;
const UAE_LAT_MAX = 26.14;
const UAE_LNG_MIN = 51.0;
const UAE_LNG_MAX = 56.5;

export function isLatLngInUAE(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number') return true;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return true;
  return lat >= UAE_LAT_MIN && lat <= UAE_LAT_MAX && lng >= UAE_LNG_MIN && lng <= UAE_LNG_MAX;
}

/** Returns true if project is visible: city_id in allowed list and (if has coords) coords in UAE. */
export function isProjectInAllowedCities(project: { city_id?: number | string | null; latitude?: number | null; longitude?: number | null }): boolean {
  const cid = project.city_id != null ? (typeof project.city_id === 'string' ? parseInt(project.city_id, 10) : project.city_id) : null;
  if (cid == null || isNaN(cid) || !ALLOWED_CITY_IDS.has(cid)) return false;
  const lat = project.latitude != null ? Number(project.latitude) : null;
  const lng = project.longitude != null ? Number(project.longitude) : null;
  return isLatLngInUAE(lat, lng);
}

export function getCityIdFromParam(cityParam: string | null | undefined): number | null {
  if (!cityParam || typeof cityParam !== 'string') return null;
  const normalized = cityParam.trim().toLowerCase().replace(/_/g, ' ');
  return CITY_NAME_TO_ID[normalized] ?? null;
}

/**
 * Derive project type from static data.
 * Ready: construction_percent >= 100, or construction_inspection_date <= today.
 * Otherwise: Off-Plan.
 */
export function getProjectType(project: {
  construction_percent?: number | string | null;
  construction_inspection_date?: string | null;
}): 'Ready' | 'Off-Plan' {
  const percent = project.construction_percent;
  const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent;
  if (numPercent != null && !isNaN(numPercent) && numPercent >= 100) {
    return 'Ready';
  }
  const dateStr = project.construction_inspection_date;
  if (dateStr && typeof dateStr === 'string') {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && date <= new Date()) {
      return 'Ready';
    }
  }
  return 'Off-Plan';
}

/** Main image priority: cover → logo → first photo. */
export function getMainImage(project: {
  cover?: string | { src?: string; logo?: string } | null;
  logo?: string | { src?: string; logo?: string } | null;
  photos?: Array<string | { src?: string; logo?: string }> | null;
}): string | null {
  const coverSrc = typeof project.cover === 'string' ? project.cover : (project.cover?.src ?? project.cover?.logo);
  if (coverSrc) return coverSrc;
  const logoSrc = typeof project.logo === 'string' ? project.logo : (project.logo?.src ?? project.logo?.logo);
  if (logoSrc) return logoSrc;
  const photos = Array.isArray(project.photos) ? project.photos : [];
  const first = photos[0];
  const firstSrc = first && (typeof first === 'string' ? first : (first?.src ?? (first as any)?.logo));
  return firstSrc ?? null;
}

/** In-memory cache for descriptions.json to avoid repeated filesystem reads. */
let _descriptionsCache: Record<string, string> | null = null;

export function getStoredDescriptions(): Record<string, string> {
  if (_descriptionsCache) return _descriptionsCache;
  try {
    const descPath = path.join(process.cwd(), 'src', 'data', 'descriptions.json');
    const raw = fs.readFileSync(descPath, 'utf8');
    _descriptionsCache = JSON.parse(raw) as Record<string, string>;
  } catch {
    _descriptionsCache = {};
  }
  return _descriptionsCache;
}

/** Returns true if the project has a non-empty stored description. */
export function hasStoredDescription(slug: string | undefined | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const descriptions = getStoredDescriptions();
  const value = descriptions[key] ?? descriptions[keyLower] ?? '';
  return typeof value === 'string' && value.trim() !== '';
}

/** Returns true if the project's stored description contains "waterfront" or "lagoon" (case-insensitive). Used for Waterfront category. */
export function descriptionContainsWaterfrontOrLagoon(slug: string | undefined | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const descriptions = getStoredDescriptions();
  const value = descriptions[key] ?? descriptions[keyLower] ?? '';
  if (typeof value !== 'string' || value.trim() === '') return false;
  const lower = value.toLowerCase();
  return lower.includes('waterfront') || lower.includes('lagoon');
}

/** In-memory cache for project-amenities.json (slug -> enum keys). */
let _projectAmenitiesCache: Record<string, string[]> | null = null;

function getProjectAmenitiesRaw(): Record<string, string[]> {
  if (_projectAmenitiesCache) return _projectAmenitiesCache;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'project-amenities.json');
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw) as Record<string, string[]>;
    _projectAmenitiesCache = typeof data === 'object' && data !== null ? data : {};
  } catch {
    _projectAmenitiesCache = {};
  }
  return _projectAmenitiesCache;
}

/** Amenity enum id -> display label (from amenity-enums.json). */
let _amenityLabelsCache: Record<string, string> | null = null;

export function getAmenityLabels(): Record<string, string> {
  if (_amenityLabelsCache) return _amenityLabelsCache;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'amenity-enums.json');
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw) as Record<string, string>;
    _amenityLabelsCache = typeof data === 'object' && data !== null ? data : {};
  } catch {
    _amenityLabelsCache = {};
  }
  return _amenityLabelsCache;
}

/** payment-plans.json: slug -> { payment_plan?, payment_plan_breakdown?, payment_plans? } */
type PaymentPlanEntry = {
  payment_plan?: string | null;
  payment_plan_breakdown?: unknown;
  payment_plans?: unknown[];
};
let _paymentPlansCache: Record<string, PaymentPlanEntry> | null = null;

function getPaymentPlansRaw(): Record<string, PaymentPlanEntry> {
  if (_paymentPlansCache) return _paymentPlansCache;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'payment-plans.json');
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw) as Record<string, PaymentPlanEntry>;
    _paymentPlansCache = typeof data === 'object' && data !== null ? data : {};
  } catch {
    _paymentPlansCache = {};
  }
  return _paymentPlansCache ?? {};
}

function formatPaymentPlansSummary(plans: unknown[]): string {
  if (!Array.isArray(plans) || plans.length === 0) return '';
  const first = plans[0] as { title?: string; info?: Record<string, unknown> } | undefined;
  if (!first || typeof first !== 'object') return '';
  const parts: string[] = [];
  if (first.title && typeof first.title === 'string') parts.push(first.title);
  const info = first.info && typeof first.info === 'object' ? first.info : null;
  if (info) {
    const onBooking = info.on_booking_percent;
    const onConstruction = info.on_construction_percent;
    const onHandover = info.on_handover_percent;
    const postHandover = info.post_handover_percent;
    const segs: string[] = [];
    if (onBooking != null && onBooking !== '') segs.push(`${onBooking}% on booking`);
    if (onConstruction != null && onConstruction !== '') segs.push(`${onConstruction}% during construction`);
    if (onHandover != null && onHandover !== '') segs.push(`${onHandover}% on handover`);
    if (postHandover != null && postHandover !== '') segs.push(`${postHandover}% post handover`);
    if (segs.length > 0) parts.push(segs.join(', '));
  }
  return parts.join(': ').trim() || '';
}

/** Returns true if we have any payment plan data (string or array) for this slug. */
export function hasStoredPaymentPlan(slug: string | undefined | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const data = getPaymentPlansRaw();
  const entry = data[key] ?? data[keyLower];
  if (!entry || typeof entry !== 'object') return false;
  if (typeof entry.payment_plan === 'string' && entry.payment_plan.trim()) return true;
  if (Array.isArray(entry.payment_plans) && entry.payment_plans.length > 0) return true;
  return false;
}

/** Persist payment plan for a slug to payment-plans.json (merge with existing). Clears in-memory cache. */
export function appendPaymentPlanToStore(slug: string, entry: PaymentPlanEntry): void {
  const key = slug.trim();
  if (!key) return;
  const p = path.join(process.cwd(), 'src', 'data', 'payment-plans.json');
  let data: Record<string, PaymentPlanEntry> = {};
  try {
    const raw = fs.readFileSync(p, 'utf8');
    data = (JSON.parse(raw) as Record<string, PaymentPlanEntry>) || {};
  } catch {
    data = {};
  }
  data[key] = { ...(data[key] || {}), ...entry };
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  _paymentPlansCache = null;
}

/** Returns stored payment plan for a project slug (string for display). Uses payment_plan if set, else formats from payment_plans. */
export function getStoredPaymentPlan(slug: string | undefined | null): string | null {
  if (!slug || typeof slug !== 'string') return null;
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const data = getPaymentPlansRaw();
  const entry = data[key] ?? data[keyLower];
  if (!entry || typeof entry !== 'object') return null;
  const plan = entry.payment_plan;
  if (typeof plan === 'string' && plan.trim()) return plan.trim();
  if (Array.isArray(entry.payment_plans) && entry.payment_plans.length > 0) {
    const summary = formatPaymentPlansSummary(entry.payment_plans);
    return summary || null;
  }
  return null;
}

/** Returns stored payment_plans array for a project slug (full API structure). */
export function getStoredPaymentPlans(slug: string | undefined | null): unknown[] | null {
  if (!slug || typeof slug !== 'string') return null;
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const data = getPaymentPlansRaw();
  const entry = data[key] ?? data[keyLower];
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.payment_plans)) return null;
  return entry.payment_plans;
}

/** Returns stored payment plan breakdown for a project slug, if any (legacy shape). */
export function getStoredPaymentPlanBreakdown(slug: string | undefined | null): Record<string, unknown> | null {
  if (!slug || typeof slug !== 'string') return null;
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const data = getPaymentPlansRaw();
  const entry = data[key] ?? data[keyLower];
  if (!entry || typeof entry !== 'object' || !entry.payment_plan_breakdown) return null;
  return entry.payment_plan_breakdown as Record<string, unknown>;
}

/** Normalized payment plan phases for API response (on booking, on construction, on handover, post handover). */
export type PaymentPlanSections = {
  on_booking?: string | number;
  on_construction?: string | number;
  on_handover?: string | number;
  post_handover?: string | number;
};

function toSectionValue(v: unknown): string | number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') return v.trim() || undefined;
  return undefined;
}

/** Returns normalized payment plan sections for a slug (from stored breakdown). */
export function getStoredPaymentPlanSections(slug: string | undefined | null): PaymentPlanSections | null {
  const breakdown = getStoredPaymentPlanBreakdown(slug);
  if (!breakdown || typeof breakdown !== 'object') return null;
  const onBooking = toSectionValue(breakdown.on_booking_percent ?? breakdown.on_booking);
  const onConstruction = toSectionValue(breakdown.on_construction_percent ?? breakdown.on_construction);
  const onHandover = toSectionValue(breakdown.on_handover_percent ?? breakdown.on_handover);
  const postHandover = toSectionValue(breakdown.post_handover_percent ?? breakdown.post_handover);
  if (onBooking === undefined && onConstruction === undefined && onHandover === undefined && postHandover === undefined) {
    return null;
  }
  return {
    ...(onBooking !== undefined && { on_booking: onBooking }),
    ...(onConstruction !== undefined && { on_construction: onConstruction }),
    ...(onHandover !== undefined && { on_handover: onHandover }),
    ...(postHandover !== undefined && { post_handover: postHandover }),
  };
}

/** Developer-keyed payment plans (on_booking, on_construction, on_handover). From payment-plans.json when in developer format. */
type DeveloperPaymentPlan = { on_booking?: number; on_construction?: number; on_handover?: number };
let _developerPaymentPlansCache: Record<string, DeveloperPaymentPlan> | null = null;
let _developerMappingCache: Record<string, string> | null = null;

function getDeveloperPaymentPlansRaw(): Record<string, DeveloperPaymentPlan> {
  if (_developerPaymentPlansCache) return _developerPaymentPlansCache;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'payment-plans.json');
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (!data || typeof data !== 'object') return (_developerPaymentPlansCache = {});
    const firstVal = Object.values(data)[0];
    const isDeveloperFormat =
      firstVal &&
      typeof firstVal === 'object' &&
      'on_booking' in (firstVal as object) &&
      !('payment_plan' in (firstVal as object));
    if (!isDeveloperFormat) return (_developerPaymentPlansCache = {});
    _developerPaymentPlansCache = data as Record<string, DeveloperPaymentPlan>;
    return _developerPaymentPlansCache;
  } catch {
    _developerPaymentPlansCache = {};
    return _developerPaymentPlansCache;
  }
}

function getDeveloperMappingRaw(): Record<string, string> {
  if (_developerMappingCache) return _developerMappingCache;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'developer-payment-plan-mapping.json');
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw) as Record<string, string>;
    _developerMappingCache = typeof data === 'object' && data !== null ? data : {};
    return _developerMappingCache;
  } catch {
    _developerMappingCache = {};
    return _developerMappingCache;
  }
}

/** Resolve builder name (as in all_data) to payment-plans.json key. Exact match then trim match. */
export function getPaymentPlanKeyForDeveloper(developer: string | undefined | null): string | null {
  if (!developer || typeof developer !== 'string') return null;
  const mapping = getDeveloperMappingRaw();
  const trimmed = developer.trim();
  if (!trimmed) return null;
  return mapping[trimmed] ?? mapping[developer] ?? null;
}

/** Returns payment plan sections (on_booking, on_construction, on_handover) for a developer from payment-plans.json. */
export function getPaymentPlanSectionsByDeveloper(developer: string | undefined | null): PaymentPlanSections | null {
  const key = getPaymentPlanKeyForDeveloper(developer);
  if (!key) return null;
  const plans = getDeveloperPaymentPlansRaw();
  const plan = plans[key];
  if (!plan || typeof plan !== 'object') return null;
  const onBooking = plan.on_booking;
  const onConstruction = plan.on_construction;
  const onHandover = plan.on_handover;
  if (onBooking === undefined && onConstruction === undefined && onHandover === undefined) return null;
  return {
    ...(onBooking !== undefined && { on_booking: onBooking }),
    ...(onConstruction !== undefined && { on_construction: onConstruction }),
    ...(onHandover !== undefined && { on_handover: onHandover }),
  };
}

/** Returns stored amenity enum keys for a project slug. Empty array if none. When not in project-amenities.json, derives from description via keyword extraction. */
export function getStoredAmenities(slug: string | undefined | null): string[] {
  if (!slug || typeof slug !== 'string') return [];
  const key = slug.trim();
  const keyLower = key.toLowerCase();
  const data = getProjectAmenitiesRaw();
  let arr = data[key] ?? data[keyLower];
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.filter((id): id is string => typeof id === 'string');
  }
  // Fallback: derive amenities from description so properties without an entry still show amenities
  const descriptions = getStoredDescriptions();
  const rawDesc = descriptions[key] ?? descriptions[keyLower] ?? '';
  if (typeof rawDesc !== 'string' || !rawDesc.trim()) return [];
  const plain = stripHtml(rawDesc);
  if (!plain.trim()) return [];
  const labels = getAmenityLabels();
  const extracted = extractAmenities(plain);
  return extracted.filter((id) => labels[id]);
}

/** Returns amenities as { id, label }[] for display. Only includes ids that exist in amenity-enums. */
export function getStoredAmenitiesWithLabels(slug: string | undefined | null): { id: string; label: string }[] {
  const ids = getStoredAmenities(slug);
  const labels = getAmenityLabels();
  return ids
    .filter((id) => labels[id])
    .map((id) => ({ id, label: labels[id] }));
}

/** Keywords that indicate a list block is an amenities list (to remove from description). */
const AMENITY_LIST_KEYWORDS = [
  'pool', 'gym', 'bbq', 'fitness', 'spa', 'amenit', 'jacuzzi', 'cinema', 'theatre',
  'play area', 'playground', 'garden', 'cafe', 'restro', 'restaurant', 'marina',
  'parking', 'concierge', 'rooftop', 'beach', 'wellness', 'yoga', 'running track',
  'padel', 'ev charging', 'smart home', 'furniture', 'medical', 'airport', 'mall',
];

function looksLikeAmenityList(html: string): boolean {
  const lower = html.toLowerCase();
  return AMENITY_LIST_KEYWORDS.some((k) => lower.includes(k));
}

/** Strip Amenities/Features/Facilities list blocks from HTML so description has no repetition with amenities section. */
export function stripAmenitiesFromDescriptionHtml(html: string): string {
  if (!html || typeof html !== 'string') return html;
  const sectionHeaders = [
    'Amenities', 'AMENITIES', 'Features', 'FEATURES', 'Facilities', 'FACILITIES',
    'وسائل الراحة', 'المرافق', 'المميزات',
  ];
  let out = html;

  // Remove explicit "Amenities:" / "Features:" / "Facilities:" sections (with optional <p></p> and <ul>)
  for (const h of sectionHeaders) {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(
        `<p>\\s*<strong>\\s*${escaped}\\s*</strong>\\s*</p>\\s*(?:<p></p>\\s*)?<ul>[\\s\\S]*?</ul>`,
        'gi'
      ),
      ''
    );
    out = out.replace(
      new RegExp(`<p>\\s*${escaped}\\s*</p>\\s*(?:<p></p>\\s*)?<ul>[\\s\\S]*?</ul>`, 'gi'),
      ''
    );
    out = out.replace(
      new RegExp(`<strong>\\s*${escaped}\\s*</strong>\\s*<ul>[\\s\\S]*?</ul>`, 'gi'),
      ''
    );
  }

  // Remove any <ul>...</ul> that looks like an amenity list (content-based)
  out = out.replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, (m) => {
    if (looksLikeAmenityList(m)) return '';
    return m;
  });

  out = out.replace(/(<p><\/p>){2,}/g, '<p></p>').trim();
  return out;
}
