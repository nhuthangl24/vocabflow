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

// PATCH /api/admin/media/[id] — update metadata + publish status
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  // Sync is_public with publish_status
  const updates: any = { ...body };
  if (body.publish_status === "published") updates.is_public = true;
  if (body.publish_status === "draft") updates.is_public = false;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from("media_assets")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}

// DELETE /api/admin/media/[id] — soft delete (set status = deleted)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Soft delete — mark as deleted rather than hard delete to preserve FK relations
  const { error } = await admin
    .from("media_assets")
    .update({ status: "deleted", is_public: false, publish_status: "draft", updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
