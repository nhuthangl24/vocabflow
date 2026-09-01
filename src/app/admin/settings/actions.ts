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

export async function updateAutoTrialSettingsAction(settings: {
  enabled: boolean;
  plan: string;
  days: number;
}) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();

  // Upsert 'auto_trial' key in provider_settings
  // Wait, Supabase UPSERT needs to match the unique constraint on 'key'.
  // First, let's see if it exists
  const { data: existing } = await adminClient.from('provider_settings').select('id').eq('key', 'auto_trial').single();

  if (existing) {
    const { error } = await adminClient.from('provider_settings')
      .update({ value: settings })
      .eq('key', 'auto_trial');
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await adminClient.from('provider_settings')
      .insert({ key: 'auto_trial', value: settings });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}
