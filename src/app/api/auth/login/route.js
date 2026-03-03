import { getDb } from '@/lib/db';
import { verifyPassword, generateToken, isAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`SELECT id, email, name, password, role FROM users WHERE email = ${email} LIMIT 1`;
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password)) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }
    const token = generateToken(user);
    const { password: _, ...safeUser } = user;
    return Response.json({ token, user: safeUser });
  } catch (e) {
    if (e.message?.includes('Database not configured')) {
      return Response.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('Login error:', e);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
