import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Verify admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
    if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, action, text, ipa, translation } = body; // Admin can supply updated text, ipa, translation

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch current report
    const { data: report } = await admin
      .from("subtitle_reports")
      .select("*, transcript_segments(*)")
      .eq("id", id)
      .single();

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // 2. If action is "publish_fix", update transcript_segments
    if (action === "publish_fix" && report.segment_id) {
      const oldSegmentData = {
        text: report.transcript_segments.text,
        ipa: report.transcript_segments.ipa,
        translation: report.transcript_segments.translation
      };

      const newSegmentData = {
        text: text !== undefined ? text : oldSegmentData.text,
        ipa: ipa !== undefined ? ipa : oldSegmentData.ipa,
        translation: translation !== undefined ? translation : oldSegmentData.translation
      };

      const { error: segError } = await admin
        .from("transcript_segments")
        .update(newSegmentData)
        .eq("id", report.segment_id);

      if (segError) throw segError;

      // Log history
      await admin.from("subtitle_report_history").insert({
        report_id: report.id,
        admin_id: user.id,
        action: "publish_fix",
        old_data: oldSegmentData,
        new_data: newSegmentData
      });
    } else {
      // Log simple status change
      await admin.from("subtitle_report_history").insert({
        report_id: report.id,
        admin_id: user.id,
        action: `status_change_${status}`
      });
    }

    // 3. Update report status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === "resolved" || status === "rejected" || status === "duplicate") {
      updateData.resolved_by = user.id;
      updateData.resolved_at = updateData.updated_at;
    }

    const { data: updatedReport, error: updateError } = await admin
      .from("subtitle_reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // TODO: Send notification to the reporter using `report.reporter_id`
    // (This requires a notification system in place)

    return NextResponse.json({ success: true, report: updatedReport });

  } catch (error: any) {
    console.error("Report resolve error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve report" }, { status: 500 });
  }
}
