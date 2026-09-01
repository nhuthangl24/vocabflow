"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function createVoucher(payload: any, sendNotification: boolean) {
  const adminUser = await verifyAdmin();
  const admin = createAdminClient();

  payload.created_by = adminUser.id;

  const { data, error } = await admin.from("vouchers").insert([payload]).select().single();
  if (error) throw new Error(error.message);

  if (sendNotification) {
    const message = `Mã: ${payload.code}\nGiảm: ${payload.discount_type === 'percent' ? payload.discount_value + '%' : payload.discount_value.toLocaleString() + 'đ'}\nHết hạn: ${payload.end_date ? new Date(payload.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}`;
    
    await admin.from("notifications").insert([{
      type: "voucher",
      title: "🎉 Voucher mới: " + payload.name,
      message,
      action_url: "/pricing?voucher=" + payload.code,
      action_text: "Sử dụng ngay",
      target_users: { type: "all" },
      created_by: adminUser.id
    }]);
  }

  revalidatePath("/admin/vouchers");
  return data;
}

export async function updateVoucher(id: string, payload: any) {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("vouchers").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/vouchers");
}

export async function deleteVoucher(id: string) {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("vouchers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/vouchers");
}

export async function toggleVoucherActive(id: string, isActive: boolean) {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("vouchers").update({ status: isActive ? 'active' : 'disabled' }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/vouchers");
}
