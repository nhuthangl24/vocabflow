import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  // Double check admin emails on layout level just in case middleware is bypassed
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0 overflow-y-auto">
        <main className="flex-1 relative z-0 p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
