const fs = require('fs');

let content = fs.readFileSync('src/components/video/VideoWorkspaceClient.tsx', 'utf8');

if (!content.includes('import dynamic')) {
    content = content.replace('import { useState } from "react";', 'import { useState, useRef } from "react";\nimport dynamic from "next/dynamic";\nconst ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });');
}

content = content.replace(
    /export default function VideoWorkspaceClient\(\{([^)]+)\}: \{([^)]+)\}\) \{/,
    'export default function VideoWorkspaceClient({ $1, transcript = [] }: { $2, transcript?: any[] }) {'
);

content = content.replace(
    /const \[activeTab, setActiveTab\] = useState<"vocab" \| "grammar">/,
    'const [activeTab, setActiveTab] = useState<"vocab" | "grammar" | "dictation">'
);

content = content.replace(
    /const \[levelFilter, setLevelFilter\] = useState<string>\("all"\);/,
    'const [levelFilter, setLevelFilter] = useState<string>("all");\n    const playerRef = useRef<any>(null);'
);

const returnIndex = content.indexOf('return (\n    <div className="w-full">');
if (returnIndex !== -1) {
    let newReturn = `return (
    <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
      {/* Left: Video Player */}
      <div className="w-full lg:w-5/12 shrink-0 lg:sticky lg:top-6">
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-neutral-800">
          <ReactPlayer ref={playerRef} url={videoUrl} width="100%" height="100%" controls playing={false} />
        </div>
      </div>

      {/* Right: Tabs & Content */}
      <div className="w-full lg:w-7/12">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-neutral-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("vocab")}
            className={\`whitespace-nowrap py-2 px-4 font-medium text-sm border-b-2 transition-colors \${activeTab === "vocab" ? "border-blue-600 text-blue-600 dark:border-white dark:text-white" : "border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-200 hover:border-gray-300"}\`}
          >
            Từ vựng ({vocabulary.length})
          </button>
          <button
            onClick={() => setActiveTab("grammar")}
            className={\`whitespace-nowrap py-2 px-4 font-medium text-sm border-b-2 transition-colors \${activeTab === "grammar" ? "border-purple-600 text-purple-600 dark:border-white dark:text-white" : "border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-200 hover:border-gray-300"}\`}
          >
            Ngữ pháp ({grammar.length})
          </button>
          <button
            onClick={() => setActiveTab("dictation")}
            className={\`whitespace-nowrap py-2 px-4 font-medium text-sm border-b-2 transition-colors \${activeTab === "dictation" ? "border-emerald-600 text-emerald-600 dark:border-white dark:text-white" : "border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-200 hover:border-gray-300"}\`}
          >
            Phụ đề CC ({transcript.length})
          </button>
        </div>`;
    
    content = content.substring(0, returnIndex) + newReturn + content.substring(content.indexOf('{activeTab === "vocab" && ('));
}

const dictationTab = `
        {activeTab === "dictation" && (
          <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-lg shadow border border-gray-200 dark:border-neutral-700 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#0a0a0a] rounded-t-lg">
              <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Chép chính tả / Shadowing</h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Bấm vào từng câu để tua video đến đoạn đó.</p>
            </div>
            <div className="p-0">
              {transcript.length === 0 ? (
                <div className="text-gray-500 dark:text-neutral-400 italic p-6 text-center">Video này chưa có phụ đề CC được trích xuất.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
                  {transcript.map((seg, i) => (
                    <div 
                      key={i}
                      onClick={() => playerRef.current?.seekTo(seg.start_time_ms / 1000, 'seconds')}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group flex gap-4"
                    >
                      <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0 pt-0.5 opacity-70 group-hover:opacity-100">
                        {new Date(seg.start_time_ms).toISOString().substr(14, 5)}
                      </div>
                      <p className="text-gray-800 dark:text-neutral-200 text-[15px] leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
`;

const lastDivIndex = content.lastIndexOf('</div>');
content = content.substring(0, lastDivIndex) + dictationTab + '      </div>\n    </div>\n  );\n}';

fs.writeFileSync('src/components/video/VideoWorkspaceClient.tsx', content);
