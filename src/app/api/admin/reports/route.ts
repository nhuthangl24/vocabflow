import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    
    const admin = createAdminClient();
    
    let query = admin
      .from("subtitle_reports")
      .select(`
        *,
        media_assets!inner(title, source_url),
        transcript_segments!inner(start_time_ms, end_time_ms, text, translation, ipa)
      `)
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false });
      
    if (status !== "all") {
      query = query.eq("status", status);
    }
    
    const { data: reports, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reports" }, { status: 500 });
  }
}
