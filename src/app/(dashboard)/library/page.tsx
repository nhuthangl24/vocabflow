import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LibraryClient from "./LibraryClient";
import { getUserPlanFeatures } from "@/lib/plans";

export default async function LibraryPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const planFeatures = await getUserPlanFeatures(user);
  const canViewSystemLibrary = planFeatures.enable_system_library;
  const page = Number(searchParams?.page) || 1;
  const searchQuery = (searchParams?.q as string) || "";
  const tab = (searchParams?.tab as string) || "private";
  const limit = 8;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let mediaAssets = [];
  let publicAssets = [];
  let playlists = [];
  let totalItems = 0;

  if (tab === "private") {
    let query = supabase
      .from("media_assets")
      .select("*, transcript_jobs(status, error_message, settings)", { count: "exact" })
      .neq("status", "deleted")
      .eq("user_id", user.id)
      .or("is_public.is.null,is_public.eq.false")
      .eq("module", "vocabulary");

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
      
    mediaAssets = data || [];
    totalItems = count || 0;
  } else {
    // Public Tab: We fetch playlists and public assets separately.
    // For simplicity in server-pagination, we prioritize playlists first, then fill with assets.
    // A production-grade approach would use a UNION view in DB, but this works for now.
    let plQuery = supabase.from("playlists").select("*", { count: "exact" });
    if (searchQuery) plQuery = plQuery.ilike("title", `%${searchQuery}%`);
    
    const { data: plData, count: plCount } = await plQuery.order("created_at", { ascending: false });
    playlists = plData || [];
    const totalPl = plCount || 0;

    let assetQuery = supabase
      .from("media_assets")
      .select("*, transcript_jobs(status, error_message, settings)", { count: "exact" })
      .neq("status", "deleted")
      .eq("is_public", true)
      .eq("module", "vocabulary");
      
    if (searchQuery) assetQuery = assetQuery.ilike("title", `%${searchQuery}%`);
    
    const { data: aData, count: aCount } = await assetQuery
      .order("created_at", { ascending: false })
      .range(0, 100); // Fetch top 100 for public assets to mix with playlists on client
      
    publicAssets = aData || [];
    // The client will still do a bit of combining for the public tab, but bounded to 100 items.
    // Private tab is fully server-paginated.
  }

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
        canViewSystemLibrary={canViewSystemLibrary}
        serverTotalItems={totalItems}
        serverPage={page}
        serverSearchQuery={searchQuery}
      />
    </div>
  );
}
