/**
 * Amenities data: prefer stored JSON (from scripts/fetch-amenities.js), fallback to API.
 */

// Stored amenities: slug -> string[] (populated by scripts/fetch-amenities.js)
import storedAmenities from '@/data/amenities.json';

const amenitiesMap = storedAmenities as Record<string, string[]>;

/**
 * Get amenities for a project by slug from stored JSON.
 * Returns empty array if not found. Use with look API for full project data.
 */
export function getStoredAmenities(slug: string | null | undefined): string[] {
  if (!slug || typeof slug !== 'string') return [];
  const key = slug.trim().toLowerCase();
  const list = amenitiesMap[key] ?? amenitiesMap[slug.trim()];
  return Array.isArray(list) ? list : [];
}

/**
 * Check if we have stored amenities for a slug (avoids unnecessary API call).
 */
export function hasStoredAmenities(slug: string | null | undefined): boolean {
  const a = getStoredAmenities(slug);
  return a.length > 0;
}
