/**
 * Shared helpers for static property data (all_data.json).
 * UAE-only filtering, city mapping, project type, descriptions cache.
 */

import path from 'path';
import fs from 'fs';

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
