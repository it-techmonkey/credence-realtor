/**
 * Translate Arabic/Urdu text to English (meaning) via /api/translate.
 * e.g. text that means "Momentum Properties" in Arabic/Urdu will show as "Momentum Properties".
 * Returns the original text if it doesn't contain Arabic/Urdu script or if translation fails.
 * Uses module-level cache to avoid repeated API calls for same strings (speeds up property list).
 */
export function containsArabic(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

const translationCache: Record<string, string> = {};
const CACHE_MAX = 500;

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || typeof text !== 'string' || !text.trim()) return text || '';
  if (!containsArabic(text)) return text;
  const key = text.trim();
  if (translationCache[key]) return translationCache[key];
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() }),
    });
    const data = await res.json();
    if (res.ok && typeof data?.translated === 'string' && data.translated) {
      const translated = data.translated;
      if (Object.keys(translationCache).length < CACHE_MAX) translationCache[key] = translated;
      return translated;
    }
  } catch (_) {
    // ignore
  }
  return text;
}

/** Translate amenity strings from Arabic/Urdu to English meaning (only items that contain Arabic/Urdu). */
export async function translateAmenities(amenities: string[]): Promise<string[]> {
  if (!Array.isArray(amenities) || amenities.length === 0) return amenities;
  const stringsToTranslate = new Set<string>();
  amenities.forEach((a) => {
    if (a && typeof a === 'string' && a.trim() && containsArabic(a)) stringsToTranslate.add(a.trim());
  });
  const cache: Record<string, string> = {};
  if (stringsToTranslate.size > 0) {
    await Promise.all(
      Array.from(stringsToTranslate).map(async (str) => {
        cache[str] = await translateToEnglish(str);
      })
    );
  }
  return amenities.map((a) => (a && typeof a === 'string' && cache[a.trim()]) ? cache[a.trim()] : a);
}
