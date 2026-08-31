import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityClient from "./ActivityClient";

export const metadata = {
  title: "Activity Log | Lumina",
};

export default async function UserActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto mb-safe min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Activity Log</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
          Nhật ký toàn bộ hoạt động trên tài khoản của bạn.
        </p>
      </div>

      <ActivityClient />
    </div>
  );
}
