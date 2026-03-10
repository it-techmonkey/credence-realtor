/**
 * Shared helpers for static property data (all_data.json).
 * UAE-only filtering, city mapping, project type, descriptions cache.
 */

import path from 'path';
import fs from 'fs';

/** UAE city IDs allowed (1–7). All other projects are excluded. */
export const UAE_CITY_IDS = new Set([1, 2, 3, 4, 5, 6, 7]);

/** Map city_id to city name. Default to Dubai if unknown. */
export const CITY_ID_TO_NAME: Record<number, string> = {
  1: 'Dubai',
  2: 'Abu Dhabi',
  3: 'Sharjah',
  4: 'Ajman',
  5: 'Ras Al Khaimah',
  6: 'Fujairah',
  7: 'Umm Al Quwain',
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
  'ajman': 4,
  'ras al khaimah': 5,
  'fujairah': 6,
  'umm al quwain': 7,
};

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
