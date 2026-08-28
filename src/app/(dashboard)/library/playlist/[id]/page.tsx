import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LibraryClient from "../../LibraryClient";

export default async function PlaylistPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Playlist
  const { data: playlist } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!playlist) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Playlist không tồn tại</h1>
        <Link href="/library" className="text-indigo-600 hover:underline mt-4 inline-block">Quay lại Thư viện</Link>
      </div>
    );
  }

  // Fetch Public Media Assets for this playlist
  const { data: publicAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(status, error_message, settings)")
    .neq("status", "deleted")
    .eq("is_public", true)
    .eq("playlist_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 sm:p-5 w-full mx-auto h-full flex flex-col">
      <div className="mb-6">
        <Link href="/library" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Thư viện</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-white">{playlist.title}</h1>
        {playlist.description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            {playlist.description}
          </p>
        )}
        <p className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {publicAssets?.length || 0} VIDEO
        </p>
      </div>

      {/* We reuse LibraryClient but only show these assets. 
          To force it to show them, we can pass them as initialAssets and force tab to private, 
          or we can modify LibraryClient. But since LibraryClient handles tabs, 
          we can just render a simplified grid here, or pass it. 
          Let's just use LibraryClient and trick it by passing them as initialAssets 
          and hiding tabs using CSS or just creating a separate simple grid. */}
          
      <LibraryClient 
        initialAssets={publicAssets || []} 
        publicAssets={[]}
        playlists={[]}
        hideTabs={true}
      />
    </div>
  );
}
