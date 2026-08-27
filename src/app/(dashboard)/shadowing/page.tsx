import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Headphones } from "lucide-react";
import ShadowingUploadBanner from "@/components/dashboard/ShadowingUploadBanner";
import ShadowingLibraryClient from "./ShadowingLibraryClient";

export const dynamic = "force-dynamic";

export default async function ShadowingLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all media assets for this user, specifically for shadowing
  const { data: rawAssets, error } = await supabase
    .from('media_assets')
    .select('*, transcript_jobs(settings)')
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Filter for shadowing module
  const assets = rawAssets?.filter(a => {
    const jobs = a.transcript_jobs as any[];
    if (!jobs || jobs.length === 0) return false;
    return jobs.some(j => j.settings?.module === 'shadowing');
  }) || [];

  // Get user limits for the upload banner
  const isPro = user?.user_metadata?.plan === 'pro'; 
  const dailyLimit = isPro ? 15 : 2;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: tc } = await supabase
    .from("media_assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())
    .neq("status", "failed")
    .neq("status", "deleted");
  
  const todayCount = tc || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Headphones className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
          Phòng luyện Shadowing
        </h1>
        <p className="mt-2 text-slate-600 dark:text-neutral-400">
          Luyện nghe và nhại lại giọng người bản xứ từ các video bạn đã xử lý.
        </p>
      </div>

      <ShadowingUploadBanner userId={user.id} isPro={isPro} todayCount={todayCount} dailyLimit={dailyLimit} />

      <div className="mt-8">
        <ShadowingLibraryClient initialAssets={assets} />
      </div>
    </div>
  );
}
