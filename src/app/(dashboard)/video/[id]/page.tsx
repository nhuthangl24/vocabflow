import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import VideoWorkspaceClient from "@/components/video/VideoWorkspaceClient";
import ProcessingStatusClient from "@/components/video/ProcessingStatusClient";
import LoadingBackButton from "@/app/(dashboard)/shadowing/[id]/LoadingBackButton";
export default async function VideoPage({ params }: { params: { id: string } }) {
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
    redirect("/dashboard");
  }

  // Get signed URL if it's a local file, otherwise use source URL
  let videoUrl = asset.source_url || "";
  if (asset.type !== "youtube" && asset.storage_path) {
    const { data: signedUrlData } = await supabase.storage
      .from("media")
      .createSignedUrl(asset.storage_path, 3600);
    if (signedUrlData) videoUrl = signedUrlData.signedUrl;
  }

  // Fetch job using adminClient to bypass RLS for public videos
  const adminClient = createAdminClient();
  const { data: job } = await adminClient
    .from("transcript_jobs")
    .select("id, status, settings")
    .eq("media_asset_id", asset.id)
    .single();

  // Fetch vocabulary & grammar
  let vocabulary = [];
  let grammar = [];
  if (job && job.status === "completed") {
    const { data: vocabData } = await adminClient
      .from("vocabulary_items")
      .select("*")
      .eq("job_id", job.id);
    if (vocabData) vocabulary = vocabData;

    const { data: grammarData } = await adminClient
      .from("grammar_items")
      .select("*")
      .eq("job_id", job.id);
    if (grammarData) grammar = grammarData;
  }

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
          <LoadingBackButton href="/dashboard" label="Quay lại Dashboard" />
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">{asset.title}</h1>
            <div className="shrink-0 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">HỌC TỪ VỰNG</span>
            </div>
          </div>
        </div>
      </div>
      
      {asset.status !== "ready" ? (
        <ProcessingStatusClient jobId={job?.id} assetId={asset.id} />
      ) : (
        <VideoWorkspaceClient 
          videoUrl={videoUrl} 
          vocabulary={vocabulary} 
          grammar={grammar}
          userId={user.id} 
          targetLanguage={job?.settings?.targetLanguage || "English"}
        />
      )}
    </div>
  );
}
