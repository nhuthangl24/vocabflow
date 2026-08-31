import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProcessingClient from "./ProcessingClient";

export const metadata = {
  title: "Processing Center | Lumina",
};

export default async function UserProcessingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto mb-safe min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Processing Center</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
          Theo dõi tiến độ xử lý video và trạng thái AI theo thời gian thực.
        </p>
      </div>

      <ProcessingClient />
    </div>
  );
}
