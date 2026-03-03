import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

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
      params.push(term, term, term, term);
      const n = params.length;
      whereParts.push(`(name ILIKE $${n - 3} OR email ILIKE $${n - 2} OR phone ILIKE $${n - 1} OR project_name ILIKE $${n})`);
    }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*)::int AS total FROM leads ${whereSql}`;
    const countResult = await sql.query(countQuery, params);
    const firstRow = Array.isArray(countResult) ? countResult[0] : countResult?.rows?.[0];
    const total = firstRow?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;

    const listParams = [...params, pageSize, offset];
    const listQuery = `SELECT * FROM leads ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const leads = await sql.query(listQuery, listParams);

    const leadsList = Array.isArray(leads) ? leads : (leads?.rows ?? []);
    return Response.json({
      leads: leadsList,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Leads GET error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const sql = getDb();
    const {
      name, phone, email, project_name, price, type, intent, status, sales_stage,
      job_title, employer, property_interests, notes, client_folder_link,
      nationality, date_of_birth, home_address, event,
    } = body;
    const [lead] = await sql`
      INSERT INTO leads (
        name, phone, email, project_name, price, type, intent, status, sales_stage,
        job_title, employer, property_interests, notes, client_folder_link,
        nationality, date_of_birth, home_address, event
      ) VALUES (
        ${name || ''}, ${phone || ''}, ${email || ''}, ${project_name || ''}, ${price ?? null}, ${type || ''}, ${intent || ''},
        ${status || 'HOT'}, ${sales_stage || 'New Inquiry'},
        ${job_title || ''}, ${employer || ''}, ${property_interests || ''}, ${notes || ''}, ${client_folder_link || ''},
        ${nationality || ''}, ${date_of_birth || null}, ${home_address || ''}, ${event || ''}
      )
      RETURNING *
    `;
    return Response.json(lead);
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Leads POST error:', e);
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
    const allowed = [
      'name', 'phone', 'email', 'project_name', 'type', 'price', 'status', 'sales_stage',
      'job_title', 'employer', 'property_interests', 'notes', 'client_folder_link',
      'nationality', 'date_of_birth', 'home_address', 'property_id', 'intent', 'event',
    ];
    const updates = {};
    for (const k of allowed) if (fields[k] !== undefined) updates[k] = fields[k];
    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }
    const cols = Object.keys(updates);
    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const query = `UPDATE leads SET ${setClause}, updated_at = NOW() WHERE id = $${cols.length + 1}`;
    const values = [...cols.map((c) => updates[c]), id];
    await sql.query(query, values);
    const [updated] = await sql`SELECT * FROM leads WHERE id = ${id}`;
    return Response.json(updated || { id });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Leads PUT error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM leads WHERE id = ${parseInt(id, 10)}`;
    return Response.json({ ok: true });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Leads DELETE error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
