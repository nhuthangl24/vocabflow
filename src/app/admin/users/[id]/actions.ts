"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getUserActivity(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function deleteUserPermanently(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { success: false, error: error.message };
  
  await admin.from('users').delete().eq('id', userId);
  
  return { success: true };
}

export async function getUserAILogs(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_usage_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function getUserMedia(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("media_assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getUserFlashcards(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getUserBilling(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getUserSessions(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_active_at", { ascending: false });
  return data || [];
}

export async function getUserLoginHistory(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("login_history")
    .select("*")
    .eq("user_id", userId)
    .order("login_time", { ascending: false })
    .limit(50);
  return data || [];
}

export async function getUserNotifications(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("notification_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getUserStudyHistory(userId: string, module?: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("study_history")
    .select("*, media_assets(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (module) {
    query = query.eq("module", module);
  }
  
  const { data } = await query;
  return data || [];
}
export async function updateUserPlan(userId: string, newPlan: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  
  // Calculate period end based on billing_period
  let currentPeriodEnd = new Date();
  const { data: planData } = await admin.from('plans').select('id, billing_period').ilike('slug', newPlan).maybeSingle();
  if (planData) {
    if (planData.billing_period === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }
    
    const { data: existingSub } = await admin.from('subscriptions').select('id').eq('user_id', userId).maybeSingle();
    if (existingSub) {
      await admin.from('subscriptions').update({ plan_id: planData.id, current_period_end: currentPeriodEnd.toISOString(), status: 'active' }).eq('id', existingSub.id);
    } else {
      await admin.from('subscriptions').insert({ user_id: userId, plan_id: planData.id, current_period_end: currentPeriodEnd.toISOString(), status: 'active' });
    }
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { plan: newPlan.toLowerCase() }
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleBanUser(userId: string, currentlyBanned: boolean) {
  await verifyAdmin();
  const admin = createAdminClient();
  const ban_duration = currentlyBanned ? 'none' : '876000h';
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function resetUserAIQuota(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  // Reset tokens to 0
  const { error } = await admin
    .from("user_stats")
    .update({ total_tokens_used: 0, total_credits_used: 0 })
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function resetUserSRSData(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  // Reset all flashcards state for this user to state=0, reps=0, etc.
  const { error } = await admin
    .from("flashcards")
    .update({ state: 0, reps: 0, repetitions: 0, lapses: 0, stability: 0, elapsed_days: 0, scheduled_days: 0, interval_days: 0 })
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createImpersonationLink(userId: string) {
  await verifyAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: (await admin.auth.admin.getUserById(userId)).data.user?.email || "",
  });
  if (error) return { success: false, error: error.message };
  return { success: true, url: data.properties.action_link };
}
