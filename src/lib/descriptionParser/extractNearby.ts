/**
 * Detect nearby facilities and location references from description text.
 * 1. Clean HTML tags.
 * 2. Normalize text to lowercase.
 * 3. Loop through whitelist; if a keyword exists in the description, add the properly cased value.
 * 4. Return unique results.
 */
import { stripHtml } from './stripHtml';

/** Display value → lowercase keywords (longer phrases first per category so "metro station" is checked before "metro"). */
const NEARBY_WHITELIST: { value: string; keywords: string[] }[] = [
  // Education
  { value: 'School', keywords: ['school', 'schools'] },
  { value: 'Nursery', keywords: ['nursery', 'nurseries'] },
  { value: 'University', keywords: ['university', 'universities'] },
  // Healthcare
  { value: 'Hospital', keywords: ['hospital', 'hospitals'] },
  { value: 'Clinic', keywords: ['clinic', 'clinics'] },
  { value: 'Pharmacy', keywords: ['pharmacy', 'pharmacies'] },
  { value: 'Landmark', keywords: ['landmark', 'landmarks'] },
  { value: 'Marina', keywords: ['marina', 'marinas'] },
  // Shopping
  { value: 'Shopping Mall', keywords: ['shopping mall', 'shopping malls'] },
  { value: 'Supermarket', keywords: ['supermarket', 'supermarkets'] },
  { value: 'Retail Shops', keywords: ['retail shops', 'retail'] },
  // Dining
  { value: 'Restaurants', keywords: ['restaurant', 'restaurants', 'dining'] },
  { value: 'Cafes', keywords: ['cafe', 'cafes', 'café', 'cafés'] },
  // Transport
  { value: 'Metro Station', keywords: ['metro station', 'metro stations'] },
  { value: 'Bus Stop', keywords: ['bus stop', 'bus stops'] },
  { value: 'Highway Access', keywords: ['highway access'] },
  // Leisure
  { value: 'Park', keywords: ['park', 'parks', 'green space'] },
  { value: 'Beach', keywords: ['beach', 'beaches'] },
  { value: 'Golf Club', keywords: ['golf club', 'golf clubs', 'golf course'] },
  // Entertainment
  { value: 'Cinema', keywords: ['cinema', 'cinemas'] },
  { value: 'Attractions', keywords: ['attraction', 'attractions'] },
  { value: 'Water Park', keywords: ['water park', 'water parks'] },
  // Location references
  { value: 'Airport', keywords: ['airport', 'airports'] },
  { value: 'Downtown', keywords: ['downtown'] },
  { value: 'Mall', keywords: ['mall', 'malls'] },
  { value: 'Metro', keywords: ['metro'] },
  { value: 'Highway', keywords: ['highway', 'highways'] },
  { value: 'Business District', keywords: ['business district', 'business districts'] },
];

export function extractNearby(htmlOrPlainText: string): string[] {
  if (!htmlOrPlainText || typeof htmlOrPlainText !== 'string') return [];
  const raw = htmlOrPlainText.trim();
  if (!raw) return [];

  const text = stripHtml(raw);
  const textLower = text.toLowerCase();
  const seen = new Set<string>();

  for (const { value, keywords } of NEARBY_WHITELIST) {
    if (seen.has(value)) continue;
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        seen.add(value);
        break;
      }
    }
  }

  return Array.from(seen);
}
