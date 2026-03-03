/**
 * Create or promote the first admin user.
 * Usage: node scripts/addAdmin.js
 * Requires: .env.local with DATABASE_URL
 * Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env.local or below.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@credence.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const sql = neon(connectionString);
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 12);

  try {
    const existing = await sql`SELECT id, role FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1`;
    if (existing.length > 0) {
      if (existing[0].role === 'ADMIN') {
        console.log('User already exists and is ADMIN:', ADMIN_EMAIL);
        process.exit(0);
      }
      await sql`UPDATE users SET password = ${hashedPassword}, name = ${ADMIN_NAME}, role = 'ADMIN', updated_at = NOW() WHERE email = ${ADMIN_EMAIL}`;
      console.log('Updated user to ADMIN:', ADMIN_EMAIL);
    } else {
      await sql`
        INSERT INTO users (email, name, password, role)
        VALUES (${ADMIN_EMAIL}, ${ADMIN_NAME}, ${hashedPassword}, 'ADMIN')
      `;
      console.log('Created admin user:', ADMIN_EMAIL);
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.message && err.message.includes('relation "users" does not exist')) {
      console.error('Run the migration first: GET /api/migrations/init');
    }
    process.exit(1);
  }
}

main();
