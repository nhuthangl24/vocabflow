import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Very basic authorization (replace with proper RBAC)
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (!user.email || !adminEmails.includes(user.email)) {
    redirect("/dashboard");
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
