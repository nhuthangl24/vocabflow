"use client";

import { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";

export default function ShadowingWorkspaceClient({ videoUrl, transcript = [] }: { videoUrl: string, transcript: any[] }) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full mt-6">
      {/* Left Column: Video Player */}
      <div className="w-full lg:w-5/12 shrink-0">
        <div className="sticky top-6">
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-neutral-800">
            {isMounted ? (
              <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              width="100%"
              height="100%"
              controls
              playing={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">Loading player...</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Transcript (Shadowing Workspace) */}
      <div className="w-full lg:w-7/12">
        <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 transition-all duration-300 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
          <div className="p-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex justify-between items-center shrink-0">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">Luyện tập Shadowing</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Bấm vào câu bất kỳ để tua video đến đúng thời điểm đó.</p>
            </div>
            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
              {transcript.length} câu
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {transcript.length === 0 ? (
              <div className="text-slate-500 dark:text-neutral-400 italic p-12 text-center h-full flex items-center justify-center">
                Video này chưa có phụ đề (CC) được trích xuất.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                {transcript.map((seg, i) => (
                  <div 
                    key={i}
                    onClick={() => { playerRef.current?.seekTo(seg.start_time_ms / 1000, 'seconds'); setIsPlaying(true); }}
                    className="p-5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer transition-colors group flex gap-5 items-start"
                  >
                    <div className="text-[13px] font-mono text-indigo-500 dark:text-indigo-400 font-bold shrink-0 pt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {new Date(seg.start_time_ms).toISOString().substr(14, 5)}
                    </div>
                    <p className="text-slate-800 dark:text-neutral-200 text-base leading-relaxed font-medium">
                      {seg.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
