import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LibraryClient from "./LibraryClient";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch ALL media assets for the library
  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(status, error_message, settings)")
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 sm:p-5 w-full mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-white">Thư viện của tôi</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-300 dark:text-neutral-400">
            {mediaAssets?.length || 0} video đã lưu trữ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Removed New Video button per user request */}
        </div>
      </div>

      <LibraryClient initialAssets={mediaAssets || []} />
    </div>
  );
}
