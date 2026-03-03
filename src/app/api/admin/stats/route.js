import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET(request) {
  const user = checkAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [leadsRows] = await sql`SELECT COUNT(*)::int AS total FROM leads`;
    const total = leadsRows?.total ?? 0;
    const [hotRows] = await sql`SELECT COUNT(*)::int AS c FROM leads WHERE status = 'HOT'`;
    const [warmRows] = await sql`SELECT COUNT(*)::int AS c FROM leads WHERE status = 'WARM'`;
    const [lostRows] = await sql`SELECT COUNT(*)::int AS c FROM leads WHERE status = 'LOST'`;
    const [enqRows] = await sql`SELECT COUNT(*)::int AS c FROM general_enquiries`;
    const enquiries = enqRows?.c ?? 0;
    const hot = hotRows?.c ?? 0;
    const warm = warmRows?.c ?? 0;
    const lost = lostRows?.c ?? 0;
    const conversionRate = enquiries > 0 ? Math.round((total / enquiries) * 100) : 0;
    const lostRate = total > 0 ? Math.round((lost / total) * 100) : 0;
    const recentLeads = await sql`
      SELECT id, name, email, phone, status, sales_stage, created_at
      FROM leads ORDER BY created_at DESC LIMIT 5
    `;
    return Response.json({
      stats: { total, hot, warm, lost, enquiries, conversionRate, lostRate },
      recentLeads: recentLeads || [],
    });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Stats error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
