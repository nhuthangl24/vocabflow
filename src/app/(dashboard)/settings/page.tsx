import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-3xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-white">Cài đặt</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-300 dark:text-neutral-400">Quản lý tài khoản và tùy chọn của bạn.</p>
      </div>
      
      <SettingsForm user={user} />
    </div>
  );
}
