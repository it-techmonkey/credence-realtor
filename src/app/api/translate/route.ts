import { NextRequest, NextResponse } from 'next/server';
import { translateToEnglishServer, containsArabicOrUrdu } from '@/lib/translateServer';

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
    const translated = await translateToEnglishServer(text);
    return NextResponse.json({ translated }, { status: 200 });
  } catch (error) {
    console.error('Translate API error:', error);
    return NextResponse.json(
      { error: 'Translation failed', translated: '' },
      { status: 500 }
    );
  }
}
