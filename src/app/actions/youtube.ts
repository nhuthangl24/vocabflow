"use server";

export async function fetchYouTubeCaptions(url: string) {
  try {
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (!videoIdMatch) {
      return { success: false, error: "Invalid YouTube URL" };
    }
    const videoId = videoIdMatch[1];
    
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { success: false, error: "Failed to fetch video page" };
    }
    
    const html = await response.text();
    
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*var/);
    if (!match) {
      // Sometimes it ends differently
      const matchAlt = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
      if (!matchAlt) {
        return { success: true, tracks: [] }; // No captions found or format changed
      }
      var playerResponseObj = JSON.parse(matchAlt[1]);
    } else {
      var playerResponseObj = JSON.parse(match[1]);
    }
    
    const captionTracks = playerResponseObj?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    
    // Filter for manual captions (vssId usually starts with "." for manual, "a." for auto)
    // Actually, vssId for auto-generated starts with "a."
    const manualTracks = captionTracks
      .filter((t: any) => t.kind !== 'asr' && !t.vssId.startsWith('a.'))
      .map((t: any) => ({
        languageCode: t.languageCode,
        name: t.name.simpleText || t.name,
        vssId: t.vssId
      }));
      
    const hasManualCaptions = manualTracks.length > 0;
      
    return {
      success: true,
      hasManualCaptions,
      tracks: manualTracks
    };
    
  } catch (error: any) {
    console.error("Error fetching YouTube captions:", error);
    return { success: false, error: error.message };
  }
}
