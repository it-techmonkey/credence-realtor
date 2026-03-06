import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import storedAmenitiesData from '@/data/amenities.json';

const ALNAIR_LOOK_API = 'https://api.alnair.ae/project/look';

const storedAmenities = (storedAmenitiesData || {}) as Record<string, string[]>;

// Load descriptions at runtime to avoid bundling ~1.1MB JSON (prevents webpack "reading 'call'" error)
let _descriptionsCache: Record<string, string> | null = null;
function getStoredDescriptions(): Record<string, string> {
  if (_descriptionsCache) return _descriptionsCache;
  try {
    const descPath = path.join(process.cwd(), 'src', 'data', 'descriptions.json');
    const raw = fs.readFileSync(descPath, 'utf8');
    _descriptionsCache = JSON.parse(raw) as Record<string, string>;
  } catch {
    _descriptionsCache = {};
  }
  return _descriptionsCache;
}

/** Strip HTML to plain text for amenity parsing (keeps list structure via newlines). */
function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<li[^>]*>/gi, ' ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, (m) => (m.includes('\n') ? '\n' : ' '))
    .trim();
}

/** Parse amenities from description text (e.g. "Amenities: Pool, Gym" or bullet list) */
function extractAmenitiesFromDescription(description: string): string[] {
  if (!description || typeof description !== 'string') return [];
  const text = description.trim();
  const results: string[] = [];
  // Section headers (EN/AR) followed by list
  const sectionRegex = /(?:Amenities|Features|Facilities|AMENITIES|وسائل الراحة|المرافق|المميزات)\s*[:\-]\s*([\s\S]*?)(?=\n\n|\n#|\n\*{2,}|$)/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = sectionRegex.exec(text)) !== null) {
    const block = m[1].trim();
    // Split by newlines, commas, " and ", bullets
    const parts = block.split(/\n|[,،]|\s+and\s+|\s+&\s+/gi).map((s) => s.replace(/^[\s\-*•·]\s*/, '').trim()).filter(Boolean);
    for (const p of parts) {
      const item = p.replace(/\s+/g, ' ').trim();
      if (item.length > 1 && item.length < 120 && !seen.has(item.toLowerCase())) {
        seen.add(item.toLowerCase());
        results.push(item);
      }
    }
  }
  // Bullet list anywhere (lines starting with - * • or number.)
  const bulletRegex = /^[\s]*[\-*•·]\s+(.+)$/gm;
  while ((m = bulletRegex.exec(text)) !== null) {
    const item = m[1].trim().replace(/\s+/g, ' ');
    if (item.length > 1 && item.length < 120 && !seen.has(item.toLowerCase())) {
      seen.add(item.toLowerCase());
      results.push(item);
    }
  }
  return results;
}

const X_AUTH_TOKEN = process.env.ALNAIR_X_AUTH_TOKEN || 'cf1ed55abb0afdff68ebc730e743b016a1d9560f9ecc40606a5c3f890c290a1c';
const X_APP_VERSION = '14.2.2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Slug is required', data: null },
        { status: 400 }
      );
    }

    const slugKey = slug.trim();
    const slugKeyLower = slugKey.toLowerCase();

    // Prefer descriptions.json: no API call, no rate limiting (loaded at runtime to avoid large bundle)
    const storedDescriptions = getStoredDescriptions();
    const storedDesc = storedDescriptions[slugKey] ?? storedDescriptions[slugKeyLower] ?? '';
    if (storedDesc && typeof storedDesc === 'string' && storedDesc.trim() !== '') {
      const description = storedDesc.trim();
      let amenities: string[] = (storedAmenities[slugKey] ?? storedAmenities[slugKeyLower] ?? []) as string[];
      if (amenities.length === 0) {
        const plainText = htmlToPlainText(description);
        amenities = extractAmenitiesFromDescription(plainText);
      }
      return NextResponse.json(
        {
          success: true,
          message: 'Project fetched from stored descriptions',
          data: {
            description,
            amenities,
            payment_plan: null,
            planned_at: null,
            construction_inspection_date: null,
            statistics: null,
            cover: null,
            galleries: [],
          },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    const url = `${ALNAIR_LOOK_API}/${slugKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-AUTH-TOKEN': X_AUTH_TOKEN,
        'X-App-Version': X_APP_VERSION,
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error(`Alnair look API error: ${status}`, text.substring(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch project: ${status}`,
          data: null,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Prefer stored amenities (from scripts/fetch-amenities.js) when available
    let amenities: string[] = (storedAmenities[slugKey] ?? storedAmenities[slugKeyLower] ?? []) as string[];
    if (amenities.length === 0) {
      const rawAmenities = data.amenities ?? data.project_amenities ?? data.facilities ?? data.features;
      if (Array.isArray(rawAmenities) && rawAmenities.length > 0) {
        amenities = rawAmenities
          .map((a: unknown) => {
            if (typeof a === 'string' && a.trim()) return a.trim();
            if (a && typeof a === 'object' && 'name' in a && typeof (a as { name: string }).name === 'string') return (a as { name: string }).name.trim();
            if (a && typeof a === 'object' && 'title' in a && typeof (a as { title: string }).title === 'string') return (a as { title: string }).title.trim();
            return null;
          })
          .filter((s): s is string => !!s);
      }
      const description = data.description || '';
      if (amenities.length === 0 && description) {
        amenities = extractAmenitiesFromDescription(description);
      }
    }

    const description = data.description || '';

    // Payment plan (string or HTML from API)
    const paymentPlan =
      (typeof data.payment_plan === 'string' && data.payment_plan.trim()) ||
      (typeof data.payment_plan_name === 'string' && data.payment_plan_name.trim()) ||
      (data.payment_plan?.title && typeof data.payment_plan.title === 'string' ? data.payment_plan.title.trim() : null) ||
      (data.catalogs?.payment_plan && typeof data.catalogs.payment_plan === 'string' ? data.catalogs.payment_plan.trim() : null) ||
      null;

    const result = {
      description,
      amenities,
      payment_plan: paymentPlan,
      planned_at: data.planned_at || data.predicted_completion_at || null,
      construction_inspection_date: data.construction_inspection_date || null,
      statistics: data.statistics || null,
      cover: data.cover || null,
      galleries: data.galleries || [],
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Project fetched successfully',
        data: result,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error in project look API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch project',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
