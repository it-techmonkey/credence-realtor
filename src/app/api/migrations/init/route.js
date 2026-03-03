import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

function allowMigration(request) {
  if (checkAuth(request)) return true;
  const secret = process.env.MIGRATION_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret;
}

export async function GET(request) {
  if (!allowMigration(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return runMigration();
}

export async function POST(request) {
  let allowed = !!checkAuth(request);
  if (!allowed && process.env.MIGRATION_SECRET) {
    try {
      const body = await request.clone().json();
      allowed = body?.secret === process.env.MIGRATION_SECRET;
    } catch {
      allowed = false;
    }
  }
  if (!allowed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return runMigration();
}


async function runMigration() {
  try {
    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER',
        phone VARCHAR(50),
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS general_enquiries (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        event VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'HOT',
        job_title VARCHAR(255),
        employer VARCHAR(255),
        property_interests TEXT,
        notes TEXT,
        client_folder_link VARCHAR(500),
        nationality VARCHAR(255),
        date_of_birth DATE,
        home_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        property_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'HOT',
        sales_stage VARCHAR(255) DEFAULT 'New Inquiry',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        price FLOAT,
        project_name VARCHAR(255),
        type VARCHAR(100),
        intent VARCHAR(255),
        event VARCHAR(255),
        job_title VARCHAR(255),
        employer VARCHAR(255),
        property_interests TEXT,
        notes TEXT,
        client_folder_link VARCHAR(500),
        nationality VARCHAR(255),
        date_of_birth DATE,
        home_address TEXT
      )
    `;

    return Response.json({ ok: true, message: 'Migration completed' });
  } catch (e) {
    console.error('Migration error:', e);
    return Response.json({ error: e.message || 'Migration failed' }, { status: 500 });
  }
}
