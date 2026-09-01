"use server";

import { createClient } from "@/lib/supabase/server";

import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes((user.email || '').toLowerCase());
}

export async function createNotificationAction(data: {
  title: string;
  message: string;
  type: string;
  action_url?: string;
  action_text?: string;
  target_users: any;
}) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await adminClient.from('notifications').insert({
    ...data,
    created_by: user?.id
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteNotificationAction(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('notifications').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
