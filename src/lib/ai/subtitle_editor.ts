import { getProvider } from "./provider";

const SYSTEM_PROMPT = `You are an expert subtitle editor for an English shadowing platform.
The transcript has already been generated and is mostly correct.

==================================================
TASKS
==================================================
1. Remove non-spoken subtitle events (e.g., [MUSIC], (applause), ♪ lyrics ♪). 
   IMPORTANT: Do NOT remove text just because it has brackets if it is spoken dialogue (e.g., [I am John.] -> KEEP).
2. Merge subtitle blocks ONLY IF they belong to the SAME sentence. 
   - DO NOT merge multiple complete sentences together. 
   - STOP merging when you encounter a period (.), question mark (?), or exclamation point (!). 
   - A single merged block MUST be short and easy to speak in one breath (max 1 sentence).
3. Do NOT rewrite or change any spoken words.

==================================================
OUTPUT FORMAT (JSON ONLY)
==================================================
You MUST return ONLY a JSON object containing the actions to apply.
If no changes are needed, return {"merges": [], "deletes": []}.
DO NOT return any text outside the JSON.
DO NOT output the actual subtitle text, ONLY their IDs.

Format:
{
  "merges": [
    [1, 2],      // Merge ID 1 and 2 together
    [5, 6, 7]    // Merge ID 5, 6, and 7 together
  ],
  "deletes": [
    3, 8         // Delete ID 3 and 8 completely
  ]
}
`;

export async function cleanSubtitles(segments: any[], userId?: string) {
  if (!segments || segments.length === 0) return [];
  
  const provider = getProvider('shadowing');
  const CHUNK_SIZE = 1000;
  const OVERLAP = 50;
  const CONCURRENCY_LIMIT = 5;
  const jobId = segments[0].job_id;
  const startTime = Date.now();
  
  // Assign sequential IDs for referencing
  const indexedSegments = segments.map((s, idx) => ({ ...s, ref_id: idx + 1 }));
  
  console.log(`[Job ${jobId}] Processing ${indexedSegments.length} segments with TRUE ACTION ENGINE...`);

  const chunksToProcess = [];
  for (let i = 0; i < indexedSegments.length; i += (CHUNK_SIZE - OVERLAP)) {
    chunksToProcess.push({
      index: i,
      chunk: indexedSegments.slice(i, i + CHUNK_SIZE)
    });
  }

  const processChunk = async ({ index, chunk }: { index: number, chunk: any[] }) => {
    let jsonInput = "";
    for (const s of chunk) {
      jsonInput += `ID ${s.ref_id}: ${s.text}\n`;
    }

    try {
      console.log(`[Job ${jobId}] Sending chunk lines ${index} to ${index + chunk.length} to KiraAI...`);
      const text = await provider.generateText({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Please process these subtitles and return Action JSON:\n\n${jsonInput}`,
        temperature: 0.1,
        tracking: {
          userId,
          jobId,
          taskType: 'subtitle_segmentation_translation',
          providerName: 'kiraai'
        }
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { success: true, parsed };
      } else {
        console.warn(`[Job ${jobId}] Failed to extract JSON from chunk ${index}.`);
        return { success: false };
      }
    } catch (err) {
      console.error(`[Job ${jobId}] Error processing chunk ${index}:`, err);
      return { success: false };
    }
  };

  // Run with concurrency limit
  const results = [];
  const executing = new Set<Promise<any>>();
  
  for (const item of chunksToProcess) {
    const p = processChunk(item);
    results.push(p);
    executing.add(p);
    p.finally(() => executing.delete(p));
    
    if (executing.size >= CONCURRENCY_LIMIT) {
      await Promise.race(executing);
    }
  }
  
  const resolvedResults = await Promise.all(results);
  
  // Global pools for actions
  const allDeletes = new Set<number>();
  const allMerges: number[][] = [];

  for (const res of resolvedResults) {
    if (res.success && res.parsed) {
      if (Array.isArray(res.parsed.deletes)) {
        res.parsed.deletes.forEach((id: number) => allDeletes.add(id));
      }
      if (Array.isArray(res.parsed.merges)) {
        allMerges.push(...res.parsed.merges);
      }
    }
  }

  // Prepare group constraints to prevent AI hallucinating mega-blocks
  const groupTextLengths = new Map<number, number>();
  for (const s of indexedSegments) {
    groupTextLengths.set(s.ref_id, s.text.length);
  }

  // Union-Find algorithm to resolve overlapping merges safely
  const parent = new Map<number, number>();
  const find = (i: number): number => {
    if (!parent.has(i)) parent.set(i, i);
    if (parent.get(i) === i) return i;
    const p = find(parent.get(i)!);
    parent.set(i, p);
    return p;
  };
  const union = (i: number, j: number) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      // Safeguard: Prevent creating blocks that are too long to shadow (max ~200 chars)
      const combinedLength = (groupTextLengths.get(rootI) || 0) + (groupTextLengths.get(rootJ) || 0);
      if (combinedLength > 200) {
        return; // Reject this merge to keep blocks small
      }
      
      if (rootI < rootJ) {
        parent.set(rootJ, rootI);
        groupTextLengths.set(rootI, combinedLength);
      } else {
        parent.set(rootI, rootJ);
        groupTextLengths.set(rootJ, combinedLength);
      }
    }
  };

  for (const mergeGroup of allMerges) {
    if (!Array.isArray(mergeGroup)) continue;
    const sorted = [...mergeGroup].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      // Safeguard: only merge IDs that are relatively close to prevent LLM hallucination chaos
      if (sorted[i + 1] - sorted[i] <= 5) {
        union(sorted[i], sorted[i + 1]);
      }
    }
  }

  // Group segments by their root parent
  const groupedSegments = new Map<number, any[]>();

  for (const s of indexedSegments) {
    if (allDeletes.has(s.ref_id)) continue;
    
    const root = find(s.ref_id);
    if (!groupedSegments.has(root)) {
      groupedSegments.set(root, []);
    }
    groupedSegments.get(root)!.push(s);
  }

  // Rebuild final segments
  const finalSegments = [];
  for (const group of Array.from(groupedSegments.values())) {
    group.sort((a, b) => a.start_time_ms - b.start_time_ms);
    
    let rawText = group.map(g => g.text).join(' ');
    
    // Clean up common subtitle artifacts (True Action Engine only merges, so we clean text here)
    let cleanText = rawText
      .replace(/>>\s*/g, '') // Bỏ dấu nhắc người nói '>>'
      .replace(/♪/g, '')     // Bỏ nốt nhạc
      .replace(/\s{2,}/g, ' ') // Xóa khoảng trắng thừa do nối chuỗi
      .trim();

    if (!cleanText) continue; // Bỏ qua nếu sau khi dọn dẹp không còn chữ nào

    finalSegments.push({
      job_id: jobId,
      start_time_ms: group[0].start_time_ms,
      end_time_ms: group[group.length - 1].end_time_ms,
      text: cleanText
    });
  }

  finalSegments.sort((a, b) => a.start_time_ms - b.start_time_ms);

  const endTime = Date.now();
  const timeTaken = ((endTime - startTime) / 1000 / 60).toFixed(2);
  console.log(`✅ [Job ${jobId}] Hoàn thành xử lý toàn bộ Subtitle bằng True Action Engine trong ${timeTaken} phút.`);

  return finalSegments;
}
