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

    // Fetch active and recent jobs for the user
    // We join with media_assets to get the video title if applicable
    const { data: jobs, error: jobsError } = await supabase
      .from('transcript_jobs')
      .select(`
        *,
        media_assets(title, status)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (jobsError) throw jobsError;

    return NextResponse.json({ success: true, jobs });

  } catch (error: any) {
    console.error("User processing API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
