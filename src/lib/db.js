import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('DATABASE_URL is not set. Admin panel and enquiries DB will not work.');
}

export const sql = connectionString ? neon(connectionString) : null;

export function getDb() {
  if (!sql) throw new Error('DATABASE_URL is not configured');
  return sql;
}
