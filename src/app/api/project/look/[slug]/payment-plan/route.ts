import { NextRequest, NextResponse } from 'next/server';
import { appendPaymentPlanToStore } from '@/lib/staticPropertyData';

function getPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const inner = (d.data ?? d.project ?? d) as Record<string, unknown> | undefined;
  return inner && typeof inner === 'object' ? inner : null;
}

function extractPaymentPlans(data: unknown): unknown[] | null {
  const payload = getPayload(data);
  if (!payload) return null;
  const raw = payload.payment_plans ?? (data as Record<string, unknown>)?.payment_plans;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw;
}

function extractPaymentPlanString(data: unknown): string | null {
  const payload = getPayload(data);
  const raw = payload?.payment_plan ?? (data as Record<string, unknown>)?.payment_plan;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return raw.trim();
}

/** POST: persist payment plan from client (browser fetched Alnair response). Body = raw Alnair JSON or { payment_plans?, payment_plan?, payment_plan_breakdown? }. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Slug is required' },
        { status: 400 }
      );
    }
    const slugKey = slug.trim();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const plans = extractPaymentPlans(data);
    const planStr = extractPaymentPlanString(data);
    const breakdown = data.payment_plan_breakdown && typeof data.payment_plan_breakdown === 'object'
      ? data.payment_plan_breakdown as Record<string, unknown>
      : null;

    if (plans && plans.length > 0) {
      const first = plans[0] as Record<string, unknown> | undefined;
      const info = first?.info && typeof first.info === 'object'
        ? (first.info as Record<string, unknown>)
        : breakdown;
      appendPaymentPlanToStore(slugKey, {
        payment_plans: plans,
        ...(info ? { payment_plan_breakdown: info } : {}),
      });
    } else if (planStr) {
      appendPaymentPlanToStore(slugKey, { payment_plan: planStr });
    } else if (breakdown) {
      appendPaymentPlanToStore(slugKey, { payment_plan_breakdown: breakdown });
    } else {
      return NextResponse.json(
        { success: false, message: 'No payment plan data in body' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Payment plan saved' });
  } catch (error) {
    console.error('Error saving payment plan:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save payment plan', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
