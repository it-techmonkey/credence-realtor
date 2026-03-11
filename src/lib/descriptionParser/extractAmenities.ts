import { AMENITY_KEYWORD_MAP, AMENITY_KEY_TO_ENUM_ID } from './types';

/**
 * Extract amenity enum ids from plain text using keyword detection.
 * Returns unique normalized amenity ids (matching amenity-enums.json).
 * Pure and composable.
 */
export function extractAmenities(plainText: string): string[] {
  if (!plainText || typeof plainText !== 'string') return [];
  const lower = plainText.toLowerCase();
  const seen = new Set<string>();

  for (const [key, keywords] of Object.entries(AMENITY_KEYWORD_MAP)) {
    const matched = keywords.some((kw) => lower.includes(kw));
    if (matched) {
      const enumId = AMENITY_KEY_TO_ENUM_ID[key] ?? key;
      if (enumId && !seen.has(enumId)) seen.add(enumId);
    }
  }

  return Array.from(seen);
}
