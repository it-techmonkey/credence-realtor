import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function POST(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { sourceId, sourceType, leadData } = body;
    if (!sourceId || !sourceType || !leadData) {
      return Response.json({ error: 'sourceId, sourceType, and leadData required' }, { status: 400 });
    }
    const sql = getDb();
    const {
      name, email, phone, projectName, price, type, intent, status, salesStage,
      job_title, employer, property_interests, notes, client_folder_link,
      nationality, date_of_birth, home_address, event,
    } = leadData;
    const [lead] = await sql`
      INSERT INTO leads (
        name, phone, email, project_name, price, type, intent, status, sales_stage,
        job_title, employer, property_interests, notes, client_folder_link,
        nationality, date_of_birth, home_address, event
      ) VALUES (
        ${name || ''}, ${phone || ''}, ${email || ''}, ${projectName || ''}, ${price ?? null}, ${type || ''}, ${intent || ''},
        ${status || 'HOT'}, ${salesStage || 'New Inquiry'},
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
    console.error('Move to leads error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
