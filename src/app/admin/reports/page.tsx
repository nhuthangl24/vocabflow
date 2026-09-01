import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReportsAdminClient from "./ReportsAdminClient";

export const metadata = {
  title: "Subtitle Reports | Admin",
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  return <ReportsAdminClient />;
}
