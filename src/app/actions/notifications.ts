"use server";

import { createClient } from "@/lib/supabase/server";

export async function getNotificationsAction(limit = 20) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch personal notifications
    const { data: personal } = await supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Fetch global notifications that are active
    const { data: globalNotifs } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Fetch more so we can filter in-memory

    // Fetch user reads for global notifications
    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id);

    const readIds = new Set((reads || []).map(r => r.notification_id));

    const userPlan = (user.user_metadata?.plan || 'free').toLowerCase();
    const userCreatedAt = new Date(user.created_at || Date.now());

    // Map and filter global to match personal structure
    const formattedGlobal = (globalNotifs || [])
      .filter(g => {
        const target = g.target_users || {};
        // 1. Check Plan target
        if (target.type === 'plan' && target.plan_id !== userPlan) return false;
        
        // 2. Check include_new_users target
        if (target.include_new_users === false) {
          const notifCreatedAt = new Date(g.created_at);
          if (userCreatedAt > notifCreatedAt) return false;
        }

        return true;
      })
      .map(g => ({
      id: g.id,
      user_id: user.id,
      type: g.type,
      title: g.title,
      content: g.message,
      action_url: g.action_url,
      is_read: readIds.has(g.id),
      created_at: g.created_at,
      is_global: true // custom flag to distinguish
    }));

    // Merge and sort
    const allNotifications = [...(personal || []), ...formattedGlobal]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    const unreadCount = allNotifications.filter(n => !n.is_read).length;

    return { 
      success: true, 
      data: allNotifications,
      unreadCount
    };
  } catch (error: any) {
    console.error("Exception fetching notifications:", error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsReadAction(notificationId: string, isGlobal = false) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (notificationId === 'all') {
      // Mark all personal as read
      await supabase
        .from('notification_history')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      // Mark all active global as read
      const { data: globalNotifs } = await supabase.from('notifications').select('id');
      if (globalNotifs && globalNotifs.length > 0) {
        const reads = globalNotifs.map(g => ({ notification_id: g.id, user_id: user.id }));
        await supabase.from('notification_reads').upsert(reads, { onConflict: 'notification_id, user_id' });
      }
      return { success: true };
    }

    if (isGlobal) {
      const { error } = await supabase.from('notification_reads').upsert({
        notification_id: notificationId,
        user_id: user.id
      }, { onConflict: 'notification_id, user_id' });
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('notification_history')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Exception marking notification as read:", error);
    return { success: false, error: error.message };
  }
}
