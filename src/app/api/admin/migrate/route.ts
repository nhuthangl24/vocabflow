import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// One-time migration: add language column to playlists
// Run this once by visiting /api/admin/migrate-playlists
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  if (!user?.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try using service role to alter table
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Supabase doesn't expose DDL via REST. Use the management API
  const projectRef = serviceUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      query: `ALTER TABLE playlists ADD COLUMN IF NOT EXISTS language text DEFAULT 'English'; UPDATE playlists SET language = 'English' WHERE language IS NULL;`
    })
  });
  
  const result = await response.json();
  
  return NextResponse.json({ 
    sql: `ALTER TABLE playlists ADD COLUMN IF NOT EXISTS language text DEFAULT 'English';\nUPDATE playlists SET language = 'English' WHERE language IS NULL;`,
    apiResult: result,
    instruction: "If API failed, please run the SQL above in Supabase Dashboard → SQL Editor"
  });
}
