import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron Job triggers this endpoint
export async function GET(request: Request) {
  try {
    // Basic security for cron (Vercel sets an authorization header for crons)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, we can bypass this check, or we can just run it via simple token
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    // 1. Tìm các subscription đã hết hạn nhưng status vẫn là active
    const { data: expiredSubs, error: fetchError } = await adminClient
      .from('subscriptions')
      .select('id, user_id, plan_id, current_period_end')
      .eq('status', 'active')
      .lte('current_period_end', now);

    if (fetchError) {
      throw new Error("Error fetching expired subscriptions: " + fetchError.message);
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      return NextResponse.json({ success: true, message: "No expired subscriptions found.", count: 0 });
    }

    // 2. Lấy ID của gói FREE
    const { data: freePlan } = await adminClient
      .from('plans')
      .select('id')
      .ilike('slug', 'free')
      .single();

    const freePlanId = freePlan?.id || 'free';

    let downgradedCount = 0;
    const errors = [];

    // 3. Xử lý từng sub
    for (const sub of expiredSubs) {
      try {
        // Cập nhật subscription status -> expired
        await adminClient
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id);

        // Ghi vào user_plan_history (nếu có bảng này)
        // Update user_metadata -> free
        await adminClient.auth.admin.updateUserById(sub.user_id, {
          user_metadata: { plan: 'free' }
        });

        // Gửi thông báo
        await adminClient.from('notification_history').insert({
          user_id: sub.user_id,
          title: 'Gói cước đã hết hạn ⚠️',
          content: `Gói cước ${sub.plan_id.toUpperCase()} của bạn đã hết hạn. Hệ thống đã tự động chuyển bạn về gói Miễn Phí. Vui lòng nâng cấp để tiếp tục trải nghiệm!`,
          type: 'alert'
        });

        downgradedCount++;
      } catch (err: any) {
        errors.push({ sub_id: sub.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${downgradedCount} expired subscriptions.`,
      count: downgradedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err: any) {
    console.error("Cron check-expired error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
