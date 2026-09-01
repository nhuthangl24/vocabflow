import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    // Note: Vercel Cron sends a secret token we can verify, or we can use our own secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Find users whose trial has ended. 
    // Since we put trial_end in raw_user_meta_data, we can query auth.users if we use postgres directly,
    // or we query public.subscriptions where current_period_end < NOW()
    
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id, id')
      .lt('current_period_end', new Date().toISOString());

    if (fetchError) throw fetchError;

    let downgradedCount = 0;
    
    // Process each expired subscription
    for (const sub of expiredSubs || []) {
      // 1. Update subscription to FREE plan
      const { data: freePlan } = await supabase.from('plans').select('id').eq('name', 'FREE').single();
      
      if (freePlan) {
        await supabase.from('subscriptions').update({
          plan_id: freePlan.id,
          current_period_end: null
        }).eq('id', sub.id);

        // 2. Update user_metadata to 'free'
        await supabase.auth.admin.updateUserById(sub.user_id, {
          user_metadata: { plan: 'free', is_trial: false, trial_end: null }
        });

        // 3. Send Notification
        await supabase.from('notification_history').insert({
          user_id: sub.user_id,
          title: 'Hết hạn gói cước',
          content: 'Thời gian sử dụng gói cước của bạn đã kết thúc. Tài khoản đã được chuyển về gói FREE.',
          type: 'billing'
        });

        downgradedCount++;
      }
    }

    return NextResponse.json({ success: true, downgradedCount });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
