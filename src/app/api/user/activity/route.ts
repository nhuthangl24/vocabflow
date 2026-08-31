import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: logs, error: logsError } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsError) throw logsError;

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    console.error("Activity API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
