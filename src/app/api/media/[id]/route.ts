import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const { data: asset } = await supabase
      .from("media_assets")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!asset) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (asset.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Hard delete
    const { error } = await supabase
      .from("media_assets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
