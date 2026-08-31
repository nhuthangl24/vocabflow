import { useEffect, useState } from "react";
import { getUserMedia } from "../actions";
import { Video, Film, Eye, EyeOff, Clock, Trash2, Edit2 } from "lucide-react";

export default function VideosTab({ userId }: { userId: string }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserMedia(userId).then(data => {
      setAssets(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải Media History...</div>;

  if (assets.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Video className="w-10 h-10 opacity-20" />
        <p>User này chưa upload hoặc tạo video nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Media Assets</h2>
        <span className="text-xs text-neutral-500">{assets.length} videos</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-4 flex gap-4 hover:bg-neutral-900/50 transition-all">
            <div className="w-24 h-16 rounded-lg bg-neutral-800 shrink-0 overflow-hidden relative">
              {asset.thumbnail_url ? (
                <img src={asset.thumbnail_url} alt={asset.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><Film className="w-6 h-6 text-neutral-600" /></div>
              )}
              {asset.duration_seconds > 0 && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                  {Math.floor(asset.duration_seconds / 60)}:{String(asset.duration_seconds % 60).padStart(2, '0')}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-neutral-200 truncate">{asset.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  asset.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  asset.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>{asset.status}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  asset.publish_status === 'published' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                  'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}>{asset.publish_status}</span>
                <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">{asset.module}</span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(asset.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
