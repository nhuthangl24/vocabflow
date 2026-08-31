import { NextResponse, NextRequest } from 'next/server';
import { sql, hasDbUrl } from '@/lib/db/admin';

export async function POST(req: NextRequest) {
  if (!hasDbUrl) {
    return NextResponse.json({ error: 'DATABASE_URL is not set in environment variables.' }, { status: 503 });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query string.' }, { status: 400 });
    }

    // Danger: Executing raw SQL. Only allow admins (in real app, add middleware auth check)
    // We use postgres.unsafe to execute arbitrary text
    const startTime = Date.now();
    const result = await sql.unsafe(query);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({ 
      success: true, 
      data: result,
      rowCount: result.count,
      durationMs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
