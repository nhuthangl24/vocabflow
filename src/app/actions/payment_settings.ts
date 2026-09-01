"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "./admin";
import { revalidatePath } from "next/cache";

export async function savePaymentSettingsAction(data: {
  id?: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  support_contact: string;
  is_active: boolean;
  is_default: boolean;
  payment_timeout_minutes?: number;
}) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();

  if (data.is_default) {
    // Unset current default
    await adminClient.from('payment_settings').update({ is_default: false }).eq('is_default', true);
  }

  const { data: newSetting, error } = await adminClient
    .from('payment_settings')
    .insert([data])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/payments/settings');
  return { success: true, data: newSetting };
}

export async function setDefaultPaymentSettingsAction(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  
  // Unset current default
  await adminClient.from('payment_settings').update({ is_default: false }).neq('id', id);
  
  // Set new default
  const { error } = await adminClient.from('payment_settings').update({ is_default: true }).eq('id', id);
  
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/payments/settings');
  return { success: true };
}

export async function deletePaymentSettingsAction(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('payment_settings').delete().eq('id', id);
  
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/payments/settings');
  return { success: true };
}
