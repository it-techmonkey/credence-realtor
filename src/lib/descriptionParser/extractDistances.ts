/**
 * Extract distance phrases like "10 minutes from airport", "5 km from mall".
 * Returns a record of place -> distance string.
 * Pure and composable.
 */
const DISTANCE_PATTERNS = [
  /(\d+)\s*(?:min(?:ute)?s?|mins?)\s+from\s+([^.]+?)(?:\.|,|$)/gi,
  /(\d+)\s*km\s+from\s+([^.]+?)(?:\.|,|$)/gi,
  /(\d+)\s*(?:min(?:ute)?s?|mins?)\s+to\s+([^.]+?)(?:\.|,|$)/gi,
  /(?:just\s+)?(\d+)\s*(?:min(?:ute)?s?|mins?)\s+from\s+([^.]+?)(?:\.|,|$)/gi,
];

function normalizePlace(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function extractDistances(plainText: string): Record<string, string> {
  if (!plainText || typeof plainText !== 'string') return {};
  const out: Record<string, string> = {};

  for (let i = 0; i < DISTANCE_PATTERNS.length; i++) {
    const pattern = DISTANCE_PATTERNS[i];
    const isKm = pattern.source.includes('km');
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(plainText)) !== null) {
      const value = isKm ? `${m[1]} km` : `${m[1]} ${m[1] === '1' ? 'min' : 'mins'}`;
      const place = normalizePlace(m[2]);
      if (place.length > 1 && place.length < 80) out[place] = value;
    }
  }

  return out;
}
