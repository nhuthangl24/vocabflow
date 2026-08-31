import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url || 'http://localhost');
    const range = searchParams.get('range') || 'today';

    let dateFilter = new Date();
    if (range === 'today') {
      dateFilter.setHours(0,0,0,0);
    } else if (range === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (range === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else {
      dateFilter = new Date(0); // all time
    }

    // Fetch AI usage
    const { data: usage, error: usageError } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false });

    if (usageError) throw usageError;

    // Calculate totals
    const totals = (usage || []).reduce((acc, curr) => ({
      prompt_tokens: acc.prompt_tokens + (curr.prompt_tokens || 0),
      completion_tokens: acc.completion_tokens + (curr.completion_tokens || 0),
      total_tokens: acc.total_tokens + (curr.total_tokens || 0),
      estimated_cost_usd: acc.estimated_cost_usd + Number(curr.estimated_cost_usd || 0),
      requests: acc.requests + 1
    }), { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, estimated_cost_usd: 0, requests: 0 });

    return NextResponse.json({ success: true, totals, history: usage });

  } catch (error: any) {
    console.error("AI usage API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
