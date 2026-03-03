import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET(req) {
  const decoded = checkAuth(req);
  if (!decoded) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, name, role, phone, profile_image, created_at
      FROM users WHERE id = ${decoded.userId} LIMIT 1
    `;
    const user = rows[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    return Response.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
