import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("provider_settings")
    .select("value")
    .eq("key", "ai_cost_rates")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rates: data?.value || {} });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createAdminClient();

  // Upsert the rates
  const { error } = await supabase
    .from("provider_settings")
    .upsert(
      { key: "ai_cost_rates", value: body.rates, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
