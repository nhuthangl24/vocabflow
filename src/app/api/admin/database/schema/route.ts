import { NextResponse } from 'next/server';
import { sql, hasDbUrl } from '@/lib/db/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDbUrl) {
    return NextResponse.json({ error: 'DATABASE_URL is not set in environment variables.' }, { status: 503 });
  }

  try {
    // Get all tables in public schema
    const tables = await sql`
      SELECT 
        t.table_name as name, 
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count,
        (
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc 
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = t.table_name
          LIMIT 1
        ) as primary_key
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `;

    // For simplicity, we just return the tables list. In a real app we'd fetch row counts using pg_stat_user_tables or raw counts.
    
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
