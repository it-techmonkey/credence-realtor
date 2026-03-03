import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

const ENQUIRY_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'subject', 'event', 'message', 'status',
  'job_title', 'employer', 'property_interests', 'notes', 'client_folder_link',
  'nationality', 'date_of_birth', 'home_address',
];

export async function GET(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const status = searchParams.get('status') || '';
    const search = (searchParams.get('search') || '').trim();
    const sql = getDb();

    const params = [];
    const whereParts = [];
    if (status) {
      params.push(status);
      whereParts.push(`status = $${params.length}`);
    }
    if (search) {
      const term = `%${search}%`;
      for (let i = 0; i < 6; i++) params.push(term);
      const n = params.length;
      whereParts.push(`(first_name ILIKE $${n - 5} OR last_name ILIKE $${n - 4} OR email ILIKE $${n - 3} OR phone ILIKE $${n - 2} OR subject ILIKE $${n - 1} OR message ILIKE $${n})`);
    }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*)::int AS total FROM general_enquiries ${whereSql}`;
    const countResult = await sql.query(countQuery, params);
    const firstRow = Array.isArray(countResult) ? countResult[0] : countResult?.rows?.[0];
    const total = firstRow?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;

    const listParams = [...params, pageSize, offset];
    const listQuery = `SELECT * FROM general_enquiries ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const enquiries = await sql.query(listQuery, listParams);

    const enquiriesList = Array.isArray(enquiries) ? enquiries : (enquiries?.rows ?? []);
    return Response.json({
      enquiries: enquiriesList,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Enquiries GET error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const sql = getDb();
    const data = {};
    for (const f of ENQUIRY_FIELDS) if (body[f] !== undefined) data[f] = body[f];
    data.email = data.email ?? '';
    data.phone = data.phone ?? '';
    data.subject = data.subject ?? 'General';
    data.message = data.message ?? '';
    const cols = Object.keys(data);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO general_enquiries (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await sql.query(query, Object.values(data));
    const inserted = Array.isArray(result) ? result[0] : result?.[0] ?? result;
    return Response.json(inserted);
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Enquiries POST error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    const updates = {};
    for (const f of ENQUIRY_FIELDS) if (fields[f] !== undefined) updates[f] = fields[f];
    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }
    const cols = Object.keys(updates);
    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const query = `UPDATE general_enquiries SET ${setClause}, updated_at = NOW() WHERE id = $${cols.length + 1}`;
    const values = [...cols.map((c) => updates[c]), id];
    await sql.query(query, values);
    const [updated] = await sql`SELECT * FROM general_enquiries WHERE id = ${id}`;
    return Response.json(updated || { id });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Enquiries PUT error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id ?? new URL(request.url).searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM general_enquiries WHERE id = ${parseInt(id, 10)}`;
    return Response.json({ ok: true });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Enquiries DELETE error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
