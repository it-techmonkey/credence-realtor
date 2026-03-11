import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredDescriptions,
  hasStoredDescription,
  getStoredAmenitiesWithLabels,
  getStoredPaymentPlan,
  getStoredPaymentPlanBreakdown,
  getStoredPaymentPlanSections,
  stripAmenitiesFromDescriptionHtml,
} from '@/lib/staticPropertyData';

const EMPTY_PAYLOAD = {
  description: '',
  amenities: [] as { id: string; label: string }[],
  payment_plan: null as string | null,
  payment_plan_breakdown: undefined as Record<string, unknown> | undefined,
  payment_plan_sections: undefined as { on_booking?: string | number; on_construction?: string | number; on_handover?: string | number; post_handover?: string | number } | undefined,
  /** When true, client should fetch payment plan from Alnair in the browser and POST back to save. */
  fetch_payment_plan_from_client: false as boolean,
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

    // Payment plan: only from store (no server-side Alnair call). Client fetches from Alnair in browser when missing.
    const storedPaymentPlan = getStoredPaymentPlan(slugKey);
    const storedPaymentPlanBreakdown = getStoredPaymentPlanBreakdown(slugKey) ?? undefined;
    const paymentPlanSections = getStoredPaymentPlanSections(slugKey) ?? undefined;
    const fetchPaymentPlanFromClient = !storedPaymentPlan && !paymentPlanSections;

    // If the slug does NOT have a stored description, return empty payload (but still include payment plan).
    if (!hasStoredDescription(slugKey)) {
      return NextResponse.json(
        {
          success: true,
          message: 'No stored description',
          data: {
            ...EMPTY_PAYLOAD,
            payment_plan: storedPaymentPlan,
            payment_plan_breakdown: storedPaymentPlanBreakdown ?? undefined,
            payment_plan_sections: paymentPlanSections,
            fetch_payment_plan_from_client: fetchPaymentPlanFromClient,
          },
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
    const rawDescription = typeof storedDesc === 'string' && storedDesc.trim() !== '' ? storedDesc.trim() : '';

    if (!rawDescription) {
      return NextResponse.json(
        {
          success: true,
          message: 'No stored description',
          data: { ...EMPTY_PAYLOAD, payment_plan: storedPaymentPlan, payment_plan_breakdown: storedPaymentPlanBreakdown ?? undefined, payment_plan_sections: paymentPlanSections, fetch_payment_plan_from_client: fetchPaymentPlanFromClient },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    const description = stripAmenitiesFromDescriptionHtml(rawDescription);
    const amenities = getStoredAmenitiesWithLabels(slugKey);

    return NextResponse.json(
      {
        success: true,
        message: 'Project fetched from stored descriptions',
        data: {
          description,
          amenities,
          payment_plan: storedPaymentPlan,
          payment_plan_breakdown: storedPaymentPlanBreakdown ?? undefined,
          payment_plan_sections: paymentPlanSections,
          fetch_payment_plan_from_client: fetchPaymentPlanFromClient,
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
