import { createAdminClient } from "@/lib/supabase/admin";
import { Clapperboard, Search } from "lucide-react";
import AdminMediaClient from "./AdminMediaClient";

export const revalidate = 0;

export default async function AdminMediaPage() {
  const supabase = createAdminClient();

  const { data: mediaAssets, error } = await supabase
    .from("media_assets")
    .select(`
      *,
      transcript_jobs (
        status,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const userMap = authUsers.reduce((acc, user) => {
    acc[user.id] = user.email || "Unknown";
    return acc;
  }, {} as Record<string, string>);

  if (error) {
    return <div className="p-10 text-red-500">Error fetching media: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Clapperboard className="w-8 h-8 text-indigo-500" />
            Media & Jobs
          </h1>
          <p className="text-slate-500 mt-2 dark:text-neutral-400">Manage uploaded videos, articles, and their processing jobs.</p>
        </div>
        
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search media..." 
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        </div>
      </div>

      <AdminMediaClient initialMedia={mediaAssets || []} userMap={userMap} />
    </div>
  );
}
