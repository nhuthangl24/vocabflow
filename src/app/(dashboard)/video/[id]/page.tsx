import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VideoWorkspaceClient from "@/components/video/VideoWorkspaceClient";
import ProcessingStatusClient from "@/components/video/ProcessingStatusClient";
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
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-4 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-gray-100 dark:text-neutral-400 dark:bg-[#0a0a0a] dark:border-neutral-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">{asset.title}</h1>
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
