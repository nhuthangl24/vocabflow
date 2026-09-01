"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "./admin";

export async function createOrderAction(planName: string, voucherCode?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Fetch plan price
  const { data: plan } = await supabase.from('plans').select('price_usd').eq('slug', planName.toLowerCase()).single();
  if (!plan) return { success: false, error: "Không tìm thấy gói." };

  let amount = plan.price_usd;
  let originalAmount = plan.price_usd;
  let discountAmount = 0;
  let voucherId = null;

  // Validate voucher securely if provided
  if (voucherCode) {
    const { data: voucher } = await supabase.from('vouchers').select('*').eq('code', String(voucherCode).toUpperCase()).single();
    if (voucher && voucher.status === 'active') {
      const now = new Date();
      const validDate = (!voucher.start_date || new Date(voucher.start_date) <= now) && (!voucher.end_date || new Date(voucher.end_date) >= now);
      const validMinOrder = !voucher.min_order || amount >= voucher.min_order;
      const validLimit = !voucher.usage_limit || voucher.used_count < voucher.usage_limit;
      
      const { count: userUsageCount } = await supabase.from('voucher_usage').select('*', { count: 'exact', head: true }).eq('voucher_id', voucher.id).eq('user_id', user.id);
      const validUserLimit = !voucher.usage_per_user || (userUsageCount || 0) < voucher.usage_per_user;

      if (validDate && validMinOrder && validLimit && validUserLimit) {
        voucherId = voucher.id;
        if (voucher.discount_type === 'percent') {
          discountAmount = (amount * voucher.discount_value) / 100;
          if (voucher.max_discount && discountAmount > voucher.max_discount) discountAmount = voucher.max_discount;
        } else {
          discountAmount = voucher.discount_value;
        }
        if (discountAmount > amount) discountAmount = amount;
        amount -= discountAmount;
      } else {
        return { success: false, error: "Voucher không hợp lệ hoặc đã hết hạn." };
      }
    } else {
      return { success: false, error: "Mã Voucher không tồn tại hoặc đã bị khóa." };
    }
  }

  // Generate random transfer content (e.g. VF + 6 random alphanumeric characters)
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const transferContent = `VF${randomStr}`;

  // Get default payment settings
  const { data: settingsArray, error: settingsError } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('is_default', true)
    .limit(1);

  if (settingsError || !settingsArray || settingsArray.length === 0) {
    console.error("Payment Settings Error:", settingsError);
    return { success: false, error: "Hệ thống thanh toán đang bảo trì." };
  }
  
  const settings = settingsArray[0];

  // Create order
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (settings.payment_timeout_minutes || 30));

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      plan_id: planName.toLowerCase(),
      amount: amount,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      voucher_id: voucherId,
      bank_code: settings.bank_code,
      account_number: settings.account_number,
      account_name: settings.account_name,
      transfer_content: transferContent,
      random_code: randomStr,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (!orderError && order) {
    // Log creation
    await supabase.from('order_logs').insert({
      order_id: order.id,
      actor_id: user.id,
      action_type: 'created',
      description: 'User initiated checkout and QR generated.'
    });

    // Send Telegram Notification
    import('@/lib/telegram/telegram').then(({ sendPaymentNotification }) => {
      sendPaymentNotification(order, user, 'new_order');
    });
  }

  if (orderError) {
    console.error("Order Creation Error:", orderError);
    return { success: false, error: "Không thể tạo đơn hàng." };
  }

  return { success: true, order, settings };
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

// Core Logic for approving order (can be used by UI or Webhook)
export async function approveOrderCore(orderId: string, actorId: string | null = null) {
  const adminClient = createAdminClient();
  
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
    
  if (orderError || !order) return { success: false, error: "Không tìm thấy đơn hàng." };
  if (order.status === 'approved') return { success: false, error: "Đơn hàng đã được duyệt." };

  await adminClient.from('orders').update({ status: 'approved', paid_at: new Date().toISOString(), approved_by: actorId }).eq('id', orderId);
  
  if (order.voucher_id) {
    const { data: voucher } = await adminClient.from('vouchers').select('used_count').eq('id', order.voucher_id).single();
    if (voucher) {
      await adminClient.from('vouchers').update({ used_count: (voucher.used_count || 0) + 1 }).eq('id', order.voucher_id);
      await adminClient.from('voucher_usage').insert({
        voucher_id: order.voucher_id,
        user_id: order.user_id,
        order_id: order.id,
        discount_amount: order.discount_amount
      });
    }
  }

  // Calculate period end based on billing_period
  let currentPeriodEnd = new Date();
  const { data: planData } = await adminClient.from('plans').select('billing_period').ilike('slug', order.plan_id).maybeSingle();
  if (planData && planData.billing_period === 'yearly') {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  } else {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  }

  // Upsert subscription
  const { data: planRow } = await adminClient.from('plans').select('id').ilike('slug', order.plan_id).single();
  if (planRow) {
    const { data: existingSub } = await adminClient.from('subscriptions').select('id').eq('user_id', order.user_id).maybeSingle();
    if (existingSub) {
      await adminClient.from('subscriptions').update({ plan_id: planRow.id, current_period_end: currentPeriodEnd.toISOString(), status: 'active' }).eq('id', existingSub.id);
    } else {
      await adminClient.from('subscriptions').insert({ user_id: order.user_id, plan_id: planRow.id, current_period_end: currentPeriodEnd.toISOString(), status: 'active' });
    }
  }

  const { error: userError } = await adminClient.auth.admin.updateUserById(order.user_id, {
    user_metadata: { plan: order.plan_id.toLowerCase() }
  });

  await adminClient.from('order_logs').insert({
    order_id: orderId,
    actor_id: actorId,
    action_type: 'approved',
    description: 'Admin approved the bank transfer and upgraded the user.'
  });

  await adminClient.from('notification_history').insert({
    user_id: order.user_id,
    title: 'Thanh toán thành công 🎉',
    content: `Đơn hàng nâng cấp gói ${order.plan_id.toUpperCase()} của bạn đã được xác nhận. Chúc bạn học tập hiệu quả!`,
    type: 'billing'
  });

  if (userError) return { success: false, error: "Lỗi khi cấp quyền gói cước: " + userError.message };

  adminClient.auth.admin.getUserById(order.user_id).then(({ data }) => {
    if (data && data.user) {
      import('@/lib/telegram/telegram').then(({ sendPaymentNotification }) => {
        sendPaymentNotification(order, data.user, 'approved');
      });
    }
  });

  return { success: true };
}

// UI Action for approving order
export async function approveOrderAction(orderId: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser();
  return approveOrderCore(orderId, user?.id || null);
}

// Core Logic for rejecting order
export async function rejectOrderCore(orderId: string, actorId: string | null = null, reason?: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();
  try {
    const { error: updateError } = await adminClient.from('orders').update({ status: 'rejected', admin_note: reason }).eq('id', orderId);
    if (updateError) return { success: false, error: updateError.message };
    
    await adminClient.from('order_logs').insert({
      order_id: orderId,
      actor_id: actorId,
      action_type: 'rejected',
      description: `Admin rejected the order. Reason: ${reason || 'None'}`
    });

    const { data: order } = await adminClient.from('orders').select('user_id, plan_id').eq('id', orderId).single();
    if (order) {
      await adminClient.from('notification_history').insert({
        user_id: order.user_id,
        title: 'Thanh toán bị từ chối ❌',
        content: `Đơn hàng gói ${order.plan_id.toUpperCase()} của bạn đã bị từ chối.${reason ? ' Lý do: ' + reason : ' Vui lòng liên hệ hỗ trợ.'}`,
        type: 'alert'
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

// UI Action for rejecting order
export async function rejectOrderAction(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser();
  return rejectOrderCore(orderId, user?.id || null, reason);
}

export async function refundOrderAction(orderId: string, reason?: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser();
  
  await adminClient.from('orders').update({ status: 'refunded', admin_note: reason }).eq('id', orderId);
  await adminClient.from('order_logs').insert({
    order_id: orderId,
    actor_id: user?.id || null,
    action_type: 'refunded',
    description: `Admin refunded the order. Reason: ${reason || 'None'}`
  });
  return { success: true };
}

export async function addAdminNoteAction(orderId: string, note: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser();
  
  await adminClient.from('orders').update({ admin_note: note }).eq('id', orderId);
  await adminClient.from('order_logs').insert({
    order_id: orderId,
    actor_id: user?.id || null,
    action_type: 'note_added',
    description: `Admin added a note: ${note}`
  });
  return { success: true };
}

export async function expireOrderAction(orderId: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from('orders')
    .update({ status: 'expired' })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) return { success: false, error: error.message };
  return { success: true };
}
