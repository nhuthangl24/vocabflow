import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LibraryClient from "./LibraryClient";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch ALL private media assets for the user (vocabulary only)
  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(status, error_message, settings)")
    .neq("status", "deleted")
    .eq("user_id", user.id)
    .or("is_public.is.null,is_public.eq.false")
    .eq("module", "vocabulary")
    .order("created_at", { ascending: false });

  // Fetch Public Playlists
  const { data: playlists } = await supabase
    .from("playlists")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch Public Media Assets (vocabulary only)
  const { data: publicAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(status, error_message, settings)")
    .neq("status", "deleted")
    .eq("is_public", true)
    .eq("module", "vocabulary")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 pb-2 sm:p-4 sm:pb-2 w-full mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight dark:text-white">Thư viện Video</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-neutral-300 dark:text-neutral-400">
            Xem lại các video bài học của bạn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Removed New Video button per user request */}
        </div>
      </div>

      <LibraryClient 
        initialAssets={mediaAssets || []} 
        publicAssets={publicAssets || []}
        playlists={playlists || []}
        hideTabs={true}
      />
    </div>
  );
}
