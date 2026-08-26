import { createClient } from "@/lib/supabase/server";
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

  // Fetch job
  const { data: job } = await supabase
    .from("transcript_jobs")
    .select("id, status")
    .eq("media_asset_id", asset.id)
    .single();

  // Fetch vocabulary
  let vocabulary = [];
  if (job && job.status === "completed") {
    const { data: vocabData } = await supabase
      .from("vocabulary_items")
      .select("*")
      .eq("job_id", job.id);
    
    if (vocabData) vocabulary = vocabData;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-4 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-gray-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
          <div className="text-sm px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-medium">Hoàn tất</div>
        </div>
      </div>
      
      {asset.status !== "ready" ? (
        <ProcessingStatusClient jobId={job?.id} assetId={asset.id} />
      ) : (
        <VideoWorkspaceClient 
          videoUrl={videoUrl} 
          vocabulary={vocabulary} 
          userId={user.id}
        />
      )}
    </div>
  );
}
