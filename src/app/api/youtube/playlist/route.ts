import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { createClient } from "@/lib/supabase/server";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Run yt-dlp to get playlist/video info without downloading
    // --dump-json outputs one json object per video
    // --flat-playlist means it won't extract individual videos if it's a playlist (super fast)
    // --no-warnings suppresses warnings
    const cmd = `yt-dlp --dump-json --flat-playlist --no-warnings ${JSON.stringify(url)}`;
    
    const { stdout } = await execAsync(cmd);
    
    if (!stdout.trim()) {
      return NextResponse.json({ error: "No video found or playlist is empty/private." }, { status: 404 });
    }

    const lines = stdout.trim().split("\n");
    const videos = lines.map(line => {
      try {
        const data = JSON.parse(line);
        // Handle cases where yt-dlp returns different structures for single vs flat playlist
        return {
          id: data.id,
          title: data.title,
          duration: data.duration, // in seconds
          uploader: data.uploader || data.channel,
          thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`,
          url: data.url || `https://www.youtube.com/watch?v=${data.id}`
        };
      } catch (e) {
        return null;
      }
    }).filter((v): v is NonNullable<typeof v> => v !== null && !!v.id);

    if (videos.length === 0) {
      return NextResponse.json({ error: "Could not parse any videos from the provided URL." }, { status: 400 });
    }

    // Now check for duplicates in the user's library
    const { data: existingAssets } = await supabase
      .from("media_assets")
      .select("id, source_url, status, title")
      .eq("user_id", user.id); // Only checking this user's assets

    // Build a set of existing IDs for this user
    const existingIds = new Set<string>();
    
    if (existingAssets) {
      existingAssets.forEach(asset => {
        if (asset.source_url) {
          const match = asset.source_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
          if (match && match[1]) {
            existingIds.add(match[1]);
          }
        }
      });
    }

    const enhancedVideos = videos.map(v => ({
      ...v,
      isDuplicate: existingIds.has(v.id)
    }));

    return NextResponse.json({ 
      success: true, 
      isPlaylist: videos.length > 1 || url.includes("list="),
      totalVideos: videos.length,
      videos: enhancedVideos 
    });

  } catch (error: any) {
    console.error("Playlist parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to process URL" }, { status: 500 });
  }
}
