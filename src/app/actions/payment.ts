"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createOrderAction(planName: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
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

export async function approveOrderAction(orderId: string) {
  const adminClient = createAdminClient();
  
  // Verify Admin (Optional: should be protected by middleware/layout anyway)
  
  // Get order
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
    
  if (orderError || !order) return { success: false, error: "Không tìm thấy đơn hàng." };
  
  if (order.status === 'approved') return { success: false, error: "Đơn hàng đã được duyệt." };

  // 1. Cập nhật Order status -> approved
  const { data: { user } } = await adminClient.auth.getUser(); // Try to get admin user if called via client
  const actor_id = user?.id || null;

  await adminClient.from('orders').update({ status: 'approved', paid_at: new Date().toISOString(), approved_by: actor_id }).eq('id', orderId);
  
  // 2. Nâng cấp Plan cho User (Lưu trong user_metadata)
  const { error: userError } = await adminClient.auth.admin.updateUserById(order.user_id, {
    user_metadata: { plan: order.plan_id.toLowerCase() }
  });

  // 3. Log
  await adminClient.from('order_logs').insert({
    order_id: orderId,
    actor_id,
    action_type: 'approved',
    description: 'Admin approved the bank transfer and upgraded the user.'
  });

  if (userError) return { success: false, error: "Lỗi khi cấp quyền gói cước: " + userError.message };

  return { success: true };
}

export async function rejectOrderAction(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();
  try {
    const { data: { user } } = await adminClient.auth.getUser();
    const { error: updateError } = await adminClient.from('orders').update({ status: 'rejected', admin_note: reason }).eq('id', orderId);
    if (updateError) return { success: false, error: updateError.message };
    await adminClient.from('order_logs').insert({
      order_id: orderId,
      actor_id: user?.id || null,
      action_type: 'rejected',
      description: `Admin rejected the order. Reason: ${reason || 'None'}`
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

export async function refundOrderAction(orderId: string, reason?: string) {
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
