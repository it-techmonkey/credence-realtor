import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET(req) {
  const user = checkAuth(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();
    const [totalRow] = await sql`SELECT COUNT(*)::int AS count FROM leads`;
    const [hotRow] = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'HOT'`;
    const [warmRow] = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'WARM'`;
    const [lostRow] = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'LOST'`;
    const [enqRow] = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries`;

    const total = totalRow?.count ?? 0;
    const hot = hotRow?.count ?? 0;
    const warm = warmRow?.count ?? 0;
    const lost = lostRow?.count ?? 0;
    const enquiries = enqRow?.count ?? 0;
    const conversionRate = enquiries > 0 ? Math.round((total / enquiries) * 100) : 0;
    const lostRate = total > 0 ? Math.round((lost / total) * 100) : 0;

    const recentLeads = await sql`
      SELECT * FROM leads ORDER BY created_at DESC LIMIT 5
    `;

    return Response.json({
      stats: { total, hot, warm, lost, enquiries, conversionRate, lostRate },
      recentLeads,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
