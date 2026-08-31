import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("price", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, plans: data });
  } catch (error: any) {
    console.error("GET plans error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const { error } = await supabase.from("plans").insert([body]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST plan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
