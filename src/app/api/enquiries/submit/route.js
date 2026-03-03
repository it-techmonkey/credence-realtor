import { getDb } from '@/lib/db';

/**
 * Public API: submit an enquiry from the website (contact form / property inquiry).
 * No auth required. Body: first_name?, last_name?, email, phone, subject?, message, event?
 */
export async function POST(req) {
  let sql;
  try {
    sql = getDb();
  } catch {
    return Response.json({ error: 'Enquiries are not configured' }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    const message = body.message?.trim();
    if (!email || !phone || !message) {
      return Response.json(
        { error: 'email, phone, and message are required' },
        { status: 400 }
      );
    }
    const [row] = await sql`
      INSERT INTO general_enquiries (
        first_name, last_name, email, phone, subject, event, message, status
      ) VALUES (
        ${body.first_name?.trim() ?? null},
        ${body.last_name?.trim() ?? null},
        ${email},
        ${phone},
        ${body.subject?.trim() ?? 'Website enquiry'},
        ${body.event?.trim() ?? null},
        ${message},
        'HOT'
      )
      RETURNING id, created_at
    `;
    return Response.json({ success: true, id: row?.id, created_at: row?.created_at });
  } catch (err) {
    console.error('Enquiry submit error:', err);
    return Response.json(
      { error: 'Failed to submit enquiry' },
      { status: 500 }
    );
  }
}
