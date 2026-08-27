import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Headphones, Play, Clock, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShadowingLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all media assets for this user that are ready
  const { data: assets, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

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

      {!assets || assets.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa có video nào</h2>
          <p className="text-slate-500 dark:text-neutral-400 mb-6">Hãy tải lên hoặc thêm video từ YouTube để bắt đầu luyện tập Shadowing.</p>
          <Link href="/dashboard" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors">
            Về trang chủ thêm video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <Link 
              key={asset.id} 
              href={`/shadowing/${asset.id}`}
              className="group bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col"
            >
              <div className="aspect-video relative bg-slate-900 overflow-hidden">
                {asset.thumbnail_url ? (
                  <img src={asset.thumbnail_url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Play className="w-12 h-12 text-white/30" />
                  </div>
                )}
                
                {/* Duration badge */}
                {asset.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded backdrop-blur-sm">
                    {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}

                {/* Hover Play overlay */}
                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <div className="w-14 h-14 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-100">
                    <Headphones className="w-6 h-6 ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {asset.title}
                </h3>
                <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(asset.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
