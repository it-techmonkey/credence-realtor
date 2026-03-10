import { NextRequest, NextResponse } from 'next/server';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const CACHE_MAX = 1000;
const serverCache = new Map<string, string>();
const MAX_CHUNK = 400; // MyMemory recommends ~500 bytes; 400 chars is safe for UTF-8

/** Arabic and Urdu script (Arabic script used for Urdu, etc.) */
function containsArabicOrUrdu(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/** Try Urdu first (ur|en), then Arabic (ar|en) - Urdu uses Arabic script so ur|en often works for both. */
async function translateChunk(q: string, langPair: 'ur|en' | 'ar|en' = 'ur|en'): Promise<string> {
  const params = new URLSearchParams({
    q,
    langpair: langPair,
  });
  const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Translate API error: ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error('No translation in response');
  return translated;
}

/** Chunk long text and translate each part, then join with space. */
async function translateLongText(text: string, langPair: 'ur|en' | 'ar|en' = 'ur|en'): Promise<string> {
  if (text.length <= MAX_CHUNK) return translateChunk(text, langPair);
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) parts.push(await translateChunk(chunk, langPair));
    start = end;
  }
  return parts.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json({ translated: '' }, { status: 200 });
    }
    if (!containsArabicOrUrdu(text)) {
      return NextResponse.json({ translated: text }, { status: 200 });
    }
    const cached = serverCache.get(text);
    if (cached) return NextResponse.json({ translated: cached }, { status: 200 });
    let translated: string;
    try {
      translated = await translateLongText(text, 'ur|en');
    } catch {
      try {
        translated = await translateLongText(text, 'ar|en');
      } catch {
        translated = text;
      }
    }
    if (serverCache.size < CACHE_MAX) serverCache.set(text, translated);
    return NextResponse.json({ translated }, { status: 200 });
  } catch (error) {
    console.error('Translate API error:', error);
    return NextResponse.json(
      { error: 'Translation failed', translated: '' },
      { status: 500 }
    );
  }
}
