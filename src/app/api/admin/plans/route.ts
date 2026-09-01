import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("plans")
      .select("*, plan_features(feature_key, is_enabled), plan_limits(limit_key, limit_value)")
      .order("sort_order", { ascending: true })
      .order("price_usd", { ascending: true });

    if (error) throw error;
    
    // Transform data to a flatter structure for frontend if needed, but returning as is is fine.
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

    const { plan_features, plan_limits, ...planData } = body;

    // Remove legacy columns from payload if they exist
    const legacyColumns = ['enable_vocabulary', 'enable_grammar', 'enable_flashcards', 'enable_srs', 'enable_library', 'enable_personal_upload', 'enable_system_library', 'enable_shadowing', 'daily_video_limit', 'max_video_duration_minutes', 'max_shadowing_minutes', 'max_vocabulary_per_video', 'monthly_shadowing_limit', 'max_ai_calls_per_month', 'max_storage_bytes', 'max_decks', 'max_flashcards', 'retention_days'];
    legacyColumns.forEach(col => delete planData[col]);

    let planId = planData.id;

    if (planId) {
      // Update existing
      const { error } = await supabase.from("plans").update(planData).eq('id', planId);
      if (error) throw error;
    } else {
      // Insert new
      const { data, error } = await supabase.from("plans").insert([planData]).select().single();
      if (error) throw error;
      planId = data.id;
    }

    // Upsert features
    if (plan_features && Array.isArray(plan_features)) {
      const featuresToInsert = plan_features.map((f: any) => ({
        plan_id: planId,
        feature_key: f.feature_key,
        is_enabled: f.is_enabled
      }));
      if (featuresToInsert.length > 0) {
        await supabase.from('plan_features').upsert(featuresToInsert, { onConflict: 'plan_id, feature_key' });
      }
    }

    // Upsert limits
    if (plan_limits && Array.isArray(plan_limits)) {
      const limitsToInsert = plan_limits.map((l: any) => ({
        plan_id: planId,
        limit_key: l.limit_key,
        limit_value: l.limit_value
      }));
      if (limitsToInsert.length > 0) {
        await supabase.from('plan_limits').upsert(limitsToInsert, { onConflict: 'plan_id, limit_key' });
      }
    }

    return NextResponse.json({ success: true, id: planId });
  } catch (error: any) {
    console.error("POST plan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
