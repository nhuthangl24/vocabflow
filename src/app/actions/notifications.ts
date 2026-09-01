"use server";

import { createClient } from "@/lib/supabase/server";

export async function getNotificationsAction(limit = 20) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: error.message };
    }

    // Lấy số lượng thông báo chưa đọc
    const { count, error: countError } = await supabase
      .from('notification_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return { 
      success: true, 
      data: data || [],
      unreadCount: count || 0
    };
  } catch (error: any) {
    console.error("Exception fetching notifications:", error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Nếu truyền id là 'all', đánh dấu tất cả
    if (notificationId === 'all') {
      const { error } = await supabase
        .from('notification_history')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Nếu truyền id cụ thể
    const { error } = await supabase
      .from('notification_history')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Exception marking notification as read:", error);
    return { success: false, error: error.message };
  }
}
