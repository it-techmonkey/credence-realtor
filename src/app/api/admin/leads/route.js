import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const status = searchParams.get('status') || '';
    const search = (searchParams.get('search') || '').trim();

    const sql = getDb();
    const term = search ? `%${search}%` : null;

    let countResult;
    let leadsResult;
    if (status && term) {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = ${status} AND (name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term})`;
      leadsResult = await sql`SELECT * FROM leads WHERE status = ${status} AND (name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term}) ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    } else if (status) {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = ${status}`;
      leadsResult = await sql`SELECT * FROM leads WHERE status = ${status} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    } else if (term) {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term}`;
      leadsResult = await sql`SELECT * FROM leads WHERE name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    } else {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM leads`;
      leadsResult = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    }

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return Response.json({
      leads: leadsResult,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (err) {
    console.error('Leads GET error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const allowed = ['name', 'phone', 'email', 'project_name', 'type', 'price', 'status', 'sales_stage', 'job_title', 'employer', 'property_interests', 'notes', 'client_folder_link', 'nationality', 'date_of_birth', 'home_address', 'property_id', 'intent', 'event'];
    const setFields = {};
    for (const k of Object.keys(updates)) {
      if (allowed.includes(k)) setFields[k] = updates[k];
    }
    if (Object.keys(setFields).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const sql = getDb();
    const [existing] = await sql`SELECT * FROM leads WHERE id = ${id} LIMIT 1`;
    if (!existing) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const merged = { ...existing, ...setFields, updated_at: new Date() };
    await sql`
      UPDATE leads SET
        name = ${merged.name},
        phone = ${merged.phone},
        email = ${merged.email ?? null},
        project_name = ${merged.project_name ?? null},
        type = ${merged.type ?? null},
        price = ${merged.price ?? null},
        status = ${merged.status ?? null},
        sales_stage = ${merged.sales_stage ?? null},
        job_title = ${merged.job_title ?? null},
        employer = ${merged.employer ?? null},
        property_interests = ${merged.property_interests ?? null},
        notes = ${merged.notes ?? null},
        client_folder_link = ${merged.client_folder_link ?? null},
        nationality = ${merged.nationality ?? null},
        date_of_birth = ${merged.date_of_birth ?? null},
        home_address = ${merged.home_address ?? null},
        property_id = ${merged.property_id ?? null},
        intent = ${merged.intent ?? null},
        event = ${merged.event ?? null},
        updated_at = ${merged.updated_at}
      WHERE id = ${id}
    `;
    const [updated] = await sql`SELECT * FROM leads WHERE id = ${id} LIMIT 1`;
    return Response.json(updated);
  } catch (err) {
    console.error('Leads PUT error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM leads WHERE id = ${parseInt(id, 10)}`;
    return Response.json({ success: true });
  } catch (err) {
    console.error('Leads DELETE error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
