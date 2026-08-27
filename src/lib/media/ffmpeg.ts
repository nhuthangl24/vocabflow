import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import path from "path";
import os from "os";

function fixPath(p: string | null | undefined) {
  if (!p) return p as any;
  // Next.js Turbopack rewrites __dirname to \ROOT\
  if (p.includes("ROOT")) {
    const relative = p.split("ROOT")[1].replace(/^[\\\/]/, '');
    return path.join(process.cwd(), relative);
  }
  return p;
}

// Set ffmpeg path
if (ffmpegStatic) {
  const p = process.env.FFMPEG_PATH;
  ffmpeg.setFfmpegPath(!p || p === 'ffmpeg' ? fixPath(ffmpegStatic) : p);
}
if (ffprobeStatic && ffprobeStatic.path) {
  ffmpeg.setFfprobePath(fixPath(ffprobeStatic.path));
}

export async function extractAudio(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);
    
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .run();
  });
}

// For long audio, we might need to chunk it. Whisper API max file size is 25MB.
// A 128kbps mp3 is ~1MB per minute, so 20 minutes is ~20MB.
// We can chunk by time (e.g., 15 minutes = 900 seconds).
export async function chunkAudio(inputPath: string, chunkSeconds = 900): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      
      const duration = metadata.format.duration;
      if (!duration) return reject(new Error("Could not determine duration"));
      
      const chunks: string[] = [];
      const numChunks = Math.ceil(duration / chunkSeconds);
      let completed = 0;
      let hasError = false;
      
      for (let i = 0; i < numChunks; i++) {
        const outputPath = path.join(os.tmpdir(), `chunk_${Date.now()}_${i}.mp3`);
        chunks.push(outputPath);
        
        ffmpeg(inputPath)
          .setStartTime(i * chunkSeconds)
          .setDuration(chunkSeconds)
          .audioCodec("libmp3lame")
          .audioBitrate(128)
          .output(outputPath)
          .on("end", () => {
            completed++;
            if (completed === numChunks && !hasError) {
              resolve(chunks);
            }
          })
          .on("error", (e) => {
            hasError = true;
            reject(e);
          })
          .run();
      }
    });
  });
}
