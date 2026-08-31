import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) return null;
  return user;
}

// POST /api/admin/media/[id]/reprocess
// Resets the media asset to pending and creates a new transcript_job
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get existing media asset
  const { data: asset, error: assetErr } = await admin
    .from("media_assets")
    .select("*")
    .eq("id", params.id)
    .single();

  if (assetErr || !asset) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // Reset asset status
  const now = new Date().toISOString();
  await admin.from("media_assets").update({
    status: "pending",
    updated_at: now,
    retry_count: (asset.retry_count || 0) + 1,
    reprocess_requested_at: now,
  }).eq("id", params.id);

  // Cancel any existing pending/processing jobs
  await admin.from("transcript_jobs").update({ status: "cancelled" })
    .eq("media_asset_id", params.id)
    .in("status", ["pending", "processing"]);

  // Create new transcript job
  const { data: newJob, error: jobErr } = await admin.from("transcript_jobs").insert({
    media_asset_id: params.id,
    user_id: asset.user_id,
    status: "pending",
    settings: {
      targetLanguage: asset.language || "English",
      module: asset.module || "vocabulary",
      isReprocess: true,
    },
    created_at: now,
    updated_at: now,
  }).select().single();

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, jobId: newJob.id });
}
