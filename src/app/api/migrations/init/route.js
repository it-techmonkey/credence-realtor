import { getDb } from '@/lib/db';

export async function GET() {
  try {
    let sql;
    try {
      sql = getDb();
    } catch (e) {
      return Response.json({ error: 'DATABASE_URL is not set' }, { status: 503 });
    }
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
    return Response.json({ success: true, message: 'Database initialized' });
  } catch (err) {
    console.error('Migration error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
