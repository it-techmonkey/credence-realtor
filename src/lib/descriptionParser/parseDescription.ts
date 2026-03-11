import { stripHtml } from './stripHtml';
import { extractAmenities } from './extractAmenities';
import { extractDistances } from './extractDistances';
import { extractNearby } from './extractNearby';
import { extractLifestyleTags } from './extractLifestyleTags';
import { generateOverview } from './generateOverview';
import type { NormalizedDescription } from './types';

/**
 * Clean raw HTML to plain text and strip amenity list blocks for cleaned_description.
 */
function cleanDescriptionHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  let out = html
    .replace(/<p>\s*<strong>\s*Amenities?:\s*<\/strong>.*?<\/ul>/gis, '')
    .replace(/<p>\s*Amenities?:\s*<\/p>.*?<\/ul>/gis, '')
    .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, (m) => (/\b(pool|gym|spa|bbq|amenit)\b/i.test(m) ? '' : m));
  out = out.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
}

/**
 * Pipeline: normalize raw HTML description into structured data for UI.
 * Runs all extractors and returns a single normalized object.
 */
export function normalizePropertyDescription(rawHtml: string): NormalizedDescription {
  const cleaned = cleanDescriptionHtml(rawHtml);
  const plain = stripHtml(rawHtml);

  const amenities = extractAmenities(plain);
  const distances = extractDistances(plain);
  const nearby = extractNearby(plain);
  const lifestyle_tags = extractLifestyleTags(plain);
  const overview = generateOverview(cleaned || plain);

  return {
    overview: overview || cleaned.slice(0, 250),
    amenities,
    lifestyle_tags,
    nearby,
    distances,
    cleaned_description: cleaned || plain,
  };
}
