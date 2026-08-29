import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Headphones } from "lucide-react";
import InlineUploadBanner from "@/components/dashboard/InlineUploadBanner";
import ShadowingLibraryClient from "./ShadowingLibraryClient";

export const dynamic = "force-dynamic";

export default async function ShadowingLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch shadowing media assets for this user (DB-level filter)
  const { data: assets } = await supabase
    .from('media_assets')
    .select('*, transcript_jobs(settings)')
    .eq('user_id', user.id)
    .or("is_public.is.null,is_public.eq.false")
    .eq('module', 'shadowing')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Fetch Public Playlists
  const { data: playlists } = await supabase
    .from("playlists")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch Public Shadowing Assets (DB-level filter)
  const { data: publicAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(settings)")
    .neq("status", "deleted")
    .eq("is_public", true)
    .eq("module", "shadowing")
    .order("created_at", { ascending: false });

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user && user.email && adminEmails.includes(user.email);
  const userPlanName = (user?.user_metadata?.plan || 'free').toUpperCase();
  const isPro = userPlanName === 'PRO';

  let dailyLimit = 0;
  if (isAdmin || userPlanName === 'PRO') {
    dailyLimit = 999999;
  } else if (userPlanName === 'BASIC') {
    dailyLimit = 5;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: tc } = await supabase
    .from("media_assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())
    .eq("user_id", user.id)
    .neq("status", "failed")
    .neq("status", "deleted")
    .eq("module", "shadowing");

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

      {isAdmin ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-500 mb-2">Admin View</h3>
          <p className="text-amber-600 dark:text-amber-600/80 mb-4">Bạn là Admin. Vui lòng chuyển sang trang "Quản lý Thư viện" để đăng video công khai lên Kho luyện tập.</p>
          <a href="/admin/library" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">
            Đến trang Quản lý
          </a>
        </div>
      ) : (
        <InlineUploadBanner 
          userId={user.id} 
          isPro={isPro}
          dailyLimit={dailyLimit}
          todayCount={todayCount}
          module="shadowing"
        />
      )}

      <div className="mt-8">
        <ShadowingLibraryClient 
          initialAssets={assets || []} 
          publicAssets={publicAssets || []} 
          playlists={playlists || []} 
        />
      </div>
    </div>
  );
}
