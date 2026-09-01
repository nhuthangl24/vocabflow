import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { video_id, segment_id, category, description, suggestion, language, room } = body;

    if (!video_id || !segment_id || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Duplicate Detection: Check if a similar report is open for this segment
    // Similar means: same segment_id and same category, status != 'resolved' and status != 'rejected'
    const { data: existingReport } = await admin
      .from("subtitle_reports")
      .select("id, status")
      .eq("segment_id", segment_id)
      .eq("category", category)
      .in("status", ["open", "investigating", "in_progress"])
      .single();

    if (existingReport) {
      // Return a 409 Conflict with the existing report ID so the frontend can ask to vote
      return NextResponse.json({ 
        error: "Duplicate report exists", 
        duplicate: true, 
        existingReportId: existingReport.id 
      }, { status: 409 });
    }

    // 2. Create new report
    const { data: report, error: reportError } = await admin
      .from("subtitle_reports")
      .insert({
        video_id,
        segment_id,
        reporter_id: user.id,
        category,
        description,
        suggestion: suggestion || {},
        language,
        room,
        status: "open",
        priority: "medium",
        vote_count: 1
      })
      .select()
      .single();

    if (reportError) {
      throw reportError;
    }

    // Automatically add a vote from the reporter
    await admin.from("subtitle_report_votes").insert({
      report_id: report.id,
      user_id: user.id
    });

    return NextResponse.json({ success: true, report });

  } catch (error: any) {
    console.error("Report create error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit report" }, { status: 500 });
  }
}
