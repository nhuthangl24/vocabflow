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

    const { report_id } = await req.json();

    if (!report_id) {
      return NextResponse.json({ error: "Missing report_id" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if already voted
    const { data: existingVote } = await admin
      .from("subtitle_report_votes")
      .select("id")
      .eq("report_id", report_id)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return NextResponse.json({ success: true, message: "Already voted" });
    }

    // Insert vote
    await admin.from("subtitle_report_votes").insert({
      report_id,
      user_id: user.id
    });

    // Increment report vote_count using rpc or by fetching and updating
    // Since we don't have rpc yet, we'll fetch and increment
    const { data: report } = await admin
      .from("subtitle_reports")
      .select("vote_count")
      .eq("id", report_id)
      .single();

    if (report) {
      await admin
        .from("subtitle_reports")
        .update({ vote_count: report.vote_count + 1 })
        .eq("id", report_id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Report vote error:", error);
    return NextResponse.json({ error: error.message || "Failed to vote" }, { status: 500 });
  }
}
