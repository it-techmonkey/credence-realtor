import { NextRequest, NextResponse } from 'next/server';
import storedAmenitiesData from '@/data/amenities.json';
import { getStoredDescriptions, hasStoredDescription } from '@/lib/staticPropertyData';

const storedAmenities = (storedAmenitiesData || {}) as Record<string, string[]>;

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
  const sectionRegex = /(?:Amenities|Features|Facilities|AMENITIES|وسائل الراحة|المرافق|المميزات)\s*[:\-]\s*([\s\S]*?)(?=\n\n|\n#|\n\*{2,}|$)/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = sectionRegex.exec(text)) !== null) {
    const block = m[1].trim();
    const parts = block.split(/\n|[,،]|\s+and\s+|\s+&\s+/gi).map((s) => s.replace(/^[\s\-*•·]\s*/, '').trim()).filter(Boolean);
    for (const p of parts) {
      const item = p.replace(/\s+/g, ' ').trim();
      if (item.length > 1 && item.length < 120 && !seen.has(item.toLowerCase())) {
        seen.add(item.toLowerCase());
        results.push(item);
      }
    }
  }
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

const EMPTY_PAYLOAD = {
  description: '',
  amenities: [] as string[],
  payment_plan: null as string | null,
  planned_at: null as string | null,
  construction_inspection_date: null as string | null,
  statistics: null,
  cover: null,
  galleries: [] as unknown[],
};

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

    // If the slug does NOT have a stored description, return empty payload immediately. Do NOT call external API.
    if (!hasStoredDescription(slugKey)) {
      return NextResponse.json(
        {
          success: true,
          message: 'No stored description',
          data: { ...EMPTY_PAYLOAD },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    const slugKeyLower = slugKey.toLowerCase();
    const storedDescriptions = getStoredDescriptions();
    const storedDesc = storedDescriptions[slugKey] ?? storedDescriptions[slugKeyLower] ?? '';
    const description = typeof storedDesc === 'string' && storedDesc.trim() !== '' ? storedDesc.trim() : '';

    if (!description) {
      return NextResponse.json(
        {
          success: true,
          message: 'No stored description',
          data: { ...EMPTY_PAYLOAD },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

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
