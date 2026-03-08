import { NextRequest, NextResponse } from 'next/server';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const CACHE_MAX = 1000;
const serverCache = new Map<string, string>();
const MAX_CHUNK = 400; // MyMemory recommends ~500 bytes; 400 chars is safe for UTF-8

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

async function translateChunk(q: string): Promise<string> {
  const params = new URLSearchParams({
    q,
    langpair: 'ar|en',
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
async function translateLongText(text: string): Promise<string> {
  if (text.length <= MAX_CHUNK) return translateChunk(text);
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) parts.push(await translateChunk(chunk));
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
    if (!containsArabic(text)) {
      return NextResponse.json({ translated: text }, { status: 200 });
    }
    const cached = serverCache.get(text);
    if (cached) return NextResponse.json({ translated: cached }, { status: 200 });
    const translated = await translateLongText(text);
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
