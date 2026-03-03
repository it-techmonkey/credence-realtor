import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET(request) {
  const decoded = checkAuth(request);
  if (!decoded) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, email, name, role FROM users WHERE id = ${decoded.userId} LIMIT 1`;
    const user = rows[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }
    return Response.json({ user });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Me error:', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
