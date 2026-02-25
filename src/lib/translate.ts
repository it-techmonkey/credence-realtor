/**
 * Translate Arabic text to English via /api/translate.
 * Returns the original text if it doesn't contain Arabic or if translation fails.
 */
export function containsArabic(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || typeof text !== 'string' || !text.trim()) return text || '';
  if (!containsArabic(text)) return text;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() }),
    });
    const data = await res.json();
    if (res.ok && typeof data?.translated === 'string' && data.translated) {
      return data.translated;
    }
  } catch (_) {
    // ignore
  }
  return text;
}

/** Translate an array of amenity strings from Arabic to English (only items that contain Arabic). */
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
