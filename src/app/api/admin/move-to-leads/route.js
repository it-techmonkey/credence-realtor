import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function POST(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { sourceId, sourceType, leadData } = body || {};
    if (!sourceId || !sourceType || !leadData) {
      return Response.json({ error: 'sourceId, sourceType, leadData required' }, { status: 400 });
    }
    if (sourceType !== 'enquiry' && sourceType !== 'client') {
      return Response.json({ error: 'sourceType must be enquiry or client' }, { status: 400 });
    }

    const sql = getDb();
    let name = leadData.name ?? '';
    let email = leadData.email ?? null;
    let phone = leadData.phone ?? '';

    if (sourceType === 'enquiry') {
      const [enq] = await sql`SELECT * FROM general_enquiries WHERE id = ${sourceId} LIMIT 1`;
      if (!enq) return Response.json({ error: 'Enquiry not found' }, { status: 404 });
      name = leadData.name || [enq.first_name, enq.last_name].filter(Boolean).join(' ') || 'Unknown';
      email = leadData.email ?? enq.email;
      phone = leadData.phone ?? enq.phone;
    }

    if (!phone) return Response.json({ error: 'Phone is required for lead' }, { status: 400 });

    const [lead] = await sql`
      INSERT INTO leads (
        name, phone, email, project_name, type, price, status, sales_stage,
        intent, event, job_title, employer, property_interests, notes,
        client_folder_link, nationality, date_of_birth, home_address
      ) VALUES (
        ${name},
        ${phone},
        ${email},
        ${leadData.projectName ?? null},
        ${leadData.type ?? null},
        ${leadData.price ?? null},
        ${leadData.status ?? 'HOT'},
        ${leadData.salesStage ?? 'New Inquiry'},
        ${leadData.intent ?? null},
        ${leadData.event ?? null},
        ${leadData.job_title ?? null},
        ${leadData.employer ?? null},
        ${leadData.property_interests ?? null},
        ${leadData.notes ?? null},
        ${leadData.client_folder_link ?? null},
        ${leadData.nationality ?? null},
        ${leadData.date_of_birth ?? null},
        ${leadData.home_address ?? null}
      )
      RETURNING *
    `;
    return Response.json(lead);
  } catch (err) {
    console.error('Move-to-leads error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
