/**
 * Detect nearby infrastructure: restaurants, malls, schools, beach, metro, etc.
 * Returns unique phrases (e.g. "Dubai Marina", "shopping malls").
 * Pure and composable.
 */
const NEARBY_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(?:dubai marina|jbr|jumeirah|downtown|difc|palm jumeirah|business bay)\b/gi, label: 'Landmark' },
  { pattern: /\b(?:restaurants?|dining|food court|caf[eé]s?)\b/gi, label: 'Restaurants' },
  { pattern: /\b(?:malls?|shopping|retail)\b/gi, label: 'Shopping' },
  { pattern: /\b(?:schools?|universit(?:y|ies)|education)\b/gi, label: 'Schools' },
  { pattern: /\b(?:beach|marina|waterfront|golf course)\b/gi, label: 'Leisure' },
  { pattern: /\b(?:metro|metro station|public transport)\b/gi, label: 'Transport' },
  { pattern: /\b(?:hospital|medical|clinic|pharmac)\b/gi, label: 'Medical' },
  { pattern: /\b(?:airport|dxb)\b/gi, label: 'Airport' },
  { pattern: /\b(?:park|parks|green space)\b/gi, label: 'Parks' },
];

export function extractNearby(plainText: string): string[] {
  if (!plainText || typeof plainText !== 'string') return [];
  const seen = new Set<string>();

  for (const { pattern, label } of NEARBY_KEYWORDS) {
    const m = plainText.match(pattern);
    if (m) {
      const normalized = label;
      if (!seen.has(normalized)) seen.add(normalized);
    }
  }

  // Also capture "X minutes from Y" places
  const fromMatch = plainText.matchAll(/(?:\d+\s*(?:min|km)\s+)?(?:from|to)\s+([A-Za-z\s]+?)(?:\.|,|$)/g);
  for (const m of fromMatch) {
    const place = m[1].trim();
    if (place.length > 2 && place.length < 50 && !seen.has(place)) seen.add(place);
  }

  return Array.from(seen);
}
