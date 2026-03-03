import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

const ENQUIRY_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'subject', 'event', 'message',
  'status', 'job_title', 'employer', 'property_interests', 'notes',
  'client_folder_link', 'nationality', 'date_of_birth', 'home_address',
];

export async function GET(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const status = searchParams.get('status') || '';
    const search = (searchParams.get('search') || '').trim();
    const term = search ? `%${search}%` : null;

    const sql = getDb();
    let countResult;
    let listResult;
    if (status && term) {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries WHERE status = ${status} AND (first_name ILIKE ${term} OR last_name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} OR subject ILIKE ${term})`;
      listResult = await sql`SELECT * FROM general_enquiries WHERE status = ${status} AND (first_name ILIKE ${term} OR last_name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} OR subject ILIKE ${term}) ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    } else if (status) {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries WHERE status = ${status}`;
      listResult = await sql`SELECT * FROM general_enquiries WHERE status = ${status} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    } else if (term) {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries WHERE first_name ILIKE ${term} OR last_name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} OR subject ILIKE ${term}`;
      listResult = await sql`SELECT * FROM general_enquiries WHERE first_name ILIKE ${term} OR last_name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} OR subject ILIKE ${term} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    } else {
      countResult = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries`;
      listResult = await sql`SELECT * FROM general_enquiries ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    }

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return Response.json({
      enquiries: listResult,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (err) {
    console.error('Enquiries GET error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = {};
    for (const f of ENQUIRY_FIELDS) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    if (!data.email || !data.phone || !data.subject || !data.message) {
      return Response.json({ error: 'email, phone, subject, message required' }, { status: 400 });
    }

    const sql = getDb();
    const [row] = await sql`
      INSERT INTO general_enquiries (first_name, last_name, email, phone, subject, event, message, status, job_title, employer, property_interests, notes, client_folder_link, nationality, date_of_birth, home_address)
      VALUES (
        ${data.first_name ?? null},
        ${data.last_name ?? null},
        ${data.email},
        ${data.phone},
        ${data.subject},
        ${data.event ?? null},
        ${data.message},
        ${data.status ?? 'HOT'},
        ${data.job_title ?? null},
        ${data.employer ?? null},
        ${data.property_interests ?? null},
        ${data.notes ?? null},
        ${data.client_folder_link ?? null},
        ${data.nationality ?? null},
        ${data.date_of_birth ?? null},
        ${data.home_address ?? null}
      )
      RETURNING *
    `;
    return Response.json(row);
  } catch (err) {
    console.error('Enquiries POST error:', err);
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

    const setFields = {};
    for (const k of ENQUIRY_FIELDS) {
      if (updates[k] !== undefined) setFields[k] = updates[k];
    }
    if (Object.keys(setFields).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const sql = getDb();
    const [existing] = await sql`SELECT * FROM general_enquiries WHERE id = ${id} LIMIT 1`;
    if (!existing) return Response.json({ error: 'Enquiry not found' }, { status: 404 });

    const merged = { ...existing, ...setFields, updated_at: new Date() };
    await sql`
      UPDATE general_enquiries SET
        first_name = ${merged.first_name ?? null},
        last_name = ${merged.last_name ?? null},
        email = ${merged.email},
        phone = ${merged.phone},
        subject = ${merged.subject},
        event = ${merged.event ?? null},
        message = ${merged.message},
        status = ${merged.status ?? null},
        job_title = ${merged.job_title ?? null},
        employer = ${merged.employer ?? null},
        property_interests = ${merged.property_interests ?? null},
        notes = ${merged.notes ?? null},
        client_folder_link = ${merged.client_folder_link ?? null},
        nationality = ${merged.nationality ?? null},
        date_of_birth = ${merged.date_of_birth ?? null},
        home_address = ${merged.home_address ?? null},
        updated_at = ${merged.updated_at}
      WHERE id = ${id}
    `;
    const [updated] = await sql`SELECT * FROM general_enquiries WHERE id = ${id} LIMIT 1`;
    return Response.json(updated);
  } catch (err) {
    console.error('Enquiries PUT error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id ?? new URL(req.url).searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM general_enquiries WHERE id = ${parseInt(id, 10)}`;
    return Response.json({ success: true });
  } catch (err) {
    console.error('Enquiries DELETE error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
