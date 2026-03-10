/**
 * Server-side translation. Uses google-translate-api-x (free, no API key) with MyMemory fallback.
 * Used by /api/translate and static APIs for property details.
 */

import translate from 'google-translate-api-x';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const CACHE_MAX = 2000;
const serverCache = new Map<string, string>();
const MAX_CHUNK = 400;

export function containsArabicOrUrdu(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/** Google Translate via google-translate-api-x (free, no API key). client 'gtx' helps avoid 403. */
async function translateWithGoogleFree(text: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await translate(text, { to: 'en', client: 'gtx' } as any);
  const out = res && typeof res === 'object' && 'text' in res ? (res as { text: string }).text : '';
  return (out && out.trim()) || text;
}

async function translateChunkMyMemory(q: string, langPair: 'ur|en' | 'ar|en'): Promise<string> {
  const params = new URLSearchParams({ q, langpair: langPair });
  const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MyMemory: ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error('No translation in response');
  return translated;
}

async function translateLongTextMyMemory(text: string, langPair: 'ur|en' | 'ar|en'): Promise<string> {
  if (text.length <= MAX_CHUNK) return translateChunkMyMemory(text, langPair);
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) parts.push(await translateChunkMyMemory(chunk, langPair));
    start = end;
  }
  return parts.join(' ');
}

/** Translate Arabic/Urdu text to English. Uses google-translate-api-x first (free), then MyMemory on failure. */
export async function translateToEnglishServer(text: string): Promise<string> {
  if (!text || typeof text !== 'string' || !text.trim()) return text || '';
  if (!containsArabicOrUrdu(text)) return text;
  const key = text.trim();
  const cached = serverCache.get(key);
  if (cached) return cached;
  try {
    let translated: string;
    try {
      if (text.length <= 5000) {
        translated = await translateWithGoogleFree(text);
      } else {
        const parts: string[] = [];
        let start = 0;
        while (start < text.length) {
          const end = Math.min(start + MAX_CHUNK, text.length);
          const chunk = text.slice(start, end).trim();
          if (chunk) parts.push(await translateWithGoogleFree(chunk));
          start = end;
        }
        translated = parts.join(' ');
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('google-translate-api-x failed, using MyMemory:', (e as Error).message);
      try {
        translated = await translateLongTextMyMemory(text, 'ur|en');
      } catch {
        translated = await translateLongTextMyMemory(text, 'ar|en').catch(() => text);
      }
    }
    if (serverCache.size < CACHE_MAX) serverCache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}
