import { NextRequest, NextResponse } from 'next/server';

const ALNAIR_LOOK_API = 'https://api.alnair.ae/project/look';

/** Strip HTML tags to get plain text for parsing */
function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse amenities from description text (e.g. "Amenities: Pool, Gym" or bullet list). Handles plain text or HTML. */
function extractAmenitiesFromDescription(description: string): string[] {
  if (!description || typeof description !== 'string') return [];
  const text = stripHtml(description).trim();
  const results: string[] = [];
  const seen = new Set<string>();
  // Section headers (EN/AR) including "Resort-style amenities" style
  const sectionRegex = /(?:Amenities|Features|Facilities|Resort-style amenities|وسائل الراحة|المرافق|المميزات)\s*[:\-]\s*([\s\S]*?)(?=\s*(?:Investment|Offer|Special|💼|✨|📩|$))/gi;
  let m: RegExpExecArray | null;
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
  // Bullet list (lines starting with - * • or number.)
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

    const url = `${ALNAIR_LOOK_API}/${slug.trim()}`;

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

    // Normalize amenities from API (array of strings or objects with name/title)
    let amenities: string[] = [];
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
    // If API didn't return amenities, parse from main description
    if (amenities.length === 0 && description) {
      amenities = extractAmenitiesFromDescription(description);
    }
    // Also extract amenities from promotions[].description (e.g. "Resort-style amenities: • Pool • Gym")
    const promotions = data.promotions ?? data.promotion ?? [];
    if (Array.isArray(promotions)) {
      const seenLower = new Set(amenities.map((a) => a.toLowerCase()));
      for (const promos of promotions) {
        const promoDesc = promos?.description ?? promos?.body ?? '';
        if (typeof promoDesc !== 'string' || !promoDesc.trim()) continue;
        const fromPromo = extractAmenitiesFromDescription(promoDesc);
        for (const a of fromPromo) {
          const key = a.toLowerCase();
          if (!seenLower.has(key)) {
            seenLower.add(key);
            amenities.push(a);
          }
        }
      }
    }

    // Payment plan (string or HTML from API)
    const paymentPlan =
      (typeof data.payment_plan === 'string' && data.payment_plan.trim()) ||
      (typeof data.payment_plan_name === 'string' && data.payment_plan_name.trim()) ||
      (data.payment_plan?.title && typeof data.payment_plan.title === 'string' ? data.payment_plan.title.trim() : null) ||
      (data.catalogs?.payment_plan && typeof data.catalogs.payment_plan === 'string' ? data.catalogs.payment_plan.trim() : null) ||
      null;

    // Structured payment plan percentages from payment_plans[].info (Alnair uses on_booking_percent, on_construction_percent, etc.)
    let paymentPlanBreakdown: {
      onBooking?: number;
      onConstruction?: number;
      onHandover?: number;
      postHandover?: number;
    } | null = null;
    const rawPlans = data.payment_plans ?? data.payment_plan;
    const planItem = Array.isArray(rawPlans) && rawPlans.length > 0 ? rawPlans[0] : (rawPlans && typeof rawPlans === 'object' ? rawPlans : null);
    const info = planItem && typeof planItem === 'object' && planItem.info && typeof planItem.info === 'object' ? planItem.info : planItem;
    if (info && typeof info === 'object') {
      const num = (v: unknown) => (typeof v === 'number' && !isNaN(v)) ? v : (typeof v === 'string' ? parseFloat(v) : NaN);
      const onBooking = num(info.on_booking_percent ?? info.on_booking_percentage);
      const onConstruction = num(info.on_construction_percent ?? info.on_construction_percentage);
      const onHandover = num(info.on_handover_percent ?? info.on_handover_percentage);
      const postHandover = num(info.post_handover_percent ?? info.post_handover_percentage);
      if (!isNaN(onBooking) || !isNaN(onConstruction) || !isNaN(onHandover) || !isNaN(postHandover)) {
        paymentPlanBreakdown = {
          onBooking: !isNaN(onBooking) ? onBooking : undefined,
          onConstruction: !isNaN(onConstruction) ? onConstruction : undefined,
          onHandover: !isNaN(onHandover) ? onHandover : undefined,
          postHandover: !isNaN(postHandover) ? postHandover : undefined,
        };
      }
    }

    const result = {
      description,
      amenities,
      payment_plan: paymentPlan,
      payment_plan_breakdown: paymentPlanBreakdown,
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
