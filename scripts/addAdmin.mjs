#!/usr/bin/env node
/**
 * Run from project root with: node scripts/addAdmin.mjs
 * Requires .env.local with DATABASE_URL and optionally:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL || 'admin@credencerealtor.com';
const password = process.env.ADMIN_PASSWORD || 'Admin@123';
const name = process.env.ADMIN_NAME || 'Admin';

if (!connectionString) {
  console.error('DATABASE_URL is required. Set it in .env.local or env.');
  process.exit(1);
}

const sql = neon(connectionString);
const SALT_ROUNDS = 12;

async function main() {
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  const existing = await sql`SELECT id, role FROM users WHERE email = ${email} LIMIT 1`;
  if (existing?.length) {
    if (existing[0].role === 'ADMIN') {
      console.log('User already exists and is ADMIN:', email);
      process.exit(0);
    }
    await sql`UPDATE users SET password = ${hashedPassword}, name = ${name}, role = 'ADMIN', updated_at = NOW() WHERE email = ${email}`;
    console.log('Updated user to ADMIN:', email);
  } else {
    await sql`
      INSERT INTO users (email, name, password, role)
      VALUES (${email}, ${name}, ${hashedPassword}, 'ADMIN')
      RETURNING id, email, name, role
    `;
    console.log('Created ADMIN user:', email);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
