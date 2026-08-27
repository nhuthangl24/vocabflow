import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Headphones, PlayCircle } from "lucide-react";
import ShadowingWorkspaceClient from "./ShadowingWorkspaceClient";

export default async function ShadowingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch asset
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (assetError || !asset || asset.user_id !== user.id) {
    redirect("/shadowing");
  }

  // Get signed URL if it's a local file, otherwise use source URL
  let videoUrl = asset.source_url || "";
  if (asset.type !== "youtube" && asset.storage_path) {
    const { data: signedUrlData } = await supabase.storage
      .from("media")
      .createSignedUrl(asset.storage_path, 3600);
    if (signedUrlData) videoUrl = signedUrlData.signedUrl;
  }

  // Fetch job
  const { data: job } = await supabase
    .from("transcript_jobs")
    .select("id, status")
    .eq("media_asset_id", asset.id)
    .single();

  // Fetch transcript segments
  let transcript = [];
  if (job && job.id) {
    const { data: segments } = await supabase
      .from("transcript_segments")
      .select("*")
      .eq("job_id", job.id)
      .order("start_time_ms", { ascending: true });
    
    if (segments) transcript = segments;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <Link href="/shadowing" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-indigo-50 border border-slate-100 dark:text-neutral-400 dark:bg-[#0a0a0a] dark:border-neutral-800 dark:hover:bg-neutral-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Kho Shadowing
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white line-clamp-2">{asset.title}</h1>
            <div className="shrink-0 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              <Headphones className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">SHADOWING MODE</span>
            </div>
          </div>
        </div>
      </div>
      
      <ShadowingWorkspaceClient 
        videoUrl={videoUrl} 
        transcript={transcript}
      />
    </div>
  );
}
