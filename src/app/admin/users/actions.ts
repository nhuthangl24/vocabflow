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

export async function fetchUsers(params: { search?: string; plan?: string; status?: string; page?: number; limit?: number }) {
  await verifyAdmin();
  const admin = createAdminClient();
  
  const limit = params.limit || 20;
  const page = params.page || 1;
  const offset = (page - 1) * limit;

  // Since auth.users is in a separate schema, we need to do some custom fetching
  // Or we use RPC if we want complex joins. But let's fetch auth.users, and then fetch stats in parallel.
  
  let authQuery = admin.auth.admin.listUsers({ page, perPage: limit });
  // Currently Supabase admin.listUsers doesn't support complex filtering.
  // A better approach for full reporting is a custom SQL RPC, or direct query if we have a view.
  // Wait, we can query auth.users directly via admin client if we use .from('users')? No, it's not exposed unless we created a view.
  // Actually, we can just use an RPC function, but to avoid making too many migrations, we can fetch all users or use listUsers and fetch related data.
  // Since this is admin, let's create a SQL View in our migration!
  
  // Wait, I can't run migration now, I already ran it. I can run another migration or just use SQL query via RPC.
  // Or I can query public.user_stats which has user_id, and then join with other public tables. But we need emails.
  // auth.users is accessible by postgres role. We can just create a view.
  
  return { success: false, error: "Not implemented" };
}
