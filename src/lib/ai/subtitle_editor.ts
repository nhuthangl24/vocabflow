import { getProvider } from "./provider";

const SYSTEM_PROMPT = `You are an expert subtitle editor and QA reviewer for an English shadowing platform.

The transcript has already been generated and is mostly correct.
Your job is NOT to rewrite the transcript.
Your job is ONLY to review, clean, and improve subtitle segmentation while preserving every spoken word exactly as spoken.

==================================================
HIGHEST PRIORITY
==================================================
Never change, paraphrase, improve grammar, simplify, or rewrite spoken content.
The transcript must remain faithful to the original audio.
False positives are much worse than false negatives.
If you are not at least 90% confident that something should be changed, KEEP the original.

==================================================
TASKS
==================================================

1. Remove non-spoken subtitle events.
Examples include: [MUSIC], (applause), (laughter), ♪ lyrics ♪
IMPORTANT: Do NOT remove text simply because it is enclosed inside [] or ().
Examples:
[I am John.] -> KEEP (spoken dialogue)
Only remove text if it clearly describes sounds, music, environment, or actions that are NOT spoken.

2. Improve subtitle segmentation.
Split subtitles only at natural language boundaries (completed clauses, punctuation, natural pauses).
Avoid splitting after words such as: and, or, but, to, of, the, a, an, because, if, when.

3. Merge subtitle blocks when appropriate.
Merge subtitles if grammar strongly suggests they belong together (e.g. the first ends with an incomplete phrase).

==================================================
OUTPUT FORMAT (JSON ONLY)
==================================================
You MUST return a JSON array containing the final, corrected subtitle segments.
DO NOT return SRT format. DO NOT return any explanations outside the JSON block.

Format each JSON object as follows:
{
  "source_ids": [number, number, ...], // Array of original segment IDs that make up this new segment.
  "text": "The cleaned spoken text."
}

Example Input:
ID 1: I want to
ID 2: go home.
ID 3: (applause)

Example Output:
[
  {
    "source_ids": [1, 2],
    "text": "I want to go home."
  }
]
`;

export async function cleanSubtitles(segments: any[]) {
  if (!segments || segments.length === 0) return [];
  
  const provider = getProvider();
  const CHUNK_SIZE = 120; // Large chunk for context
  const OVERLAP = 20; // Sliding window overlap to prevent boundary cuts
  const jobId = segments[0].job_id;
  
  // Assign sequential IDs for referencing
  const indexedSegments = segments.map((s, idx) => ({ ...s, ref_id: idx + 1 }));
  
  const finalSegments: any[] = [];
  const processedIds = new Set<number>();
  
  console.log(`[Job ${jobId}] Processing ${indexedSegments.length} segments with JSON Action Engine...`);

  // Sequential processing loop to strictly prevent 429 Rate Limits
  for (let i = 0; i < indexedSegments.length; i += (CHUNK_SIZE - OVERLAP)) {
    const chunk = indexedSegments.slice(i, i + CHUNK_SIZE);
    
    let jsonInput = "";
    for (const s of chunk) {
      jsonInput += `ID ${s.ref_id}: ${s.text}\n`;
    }

    try {
      console.log(`[Job ${jobId}] Processing chunk lines ${i} to ${i + chunk.length}...`);
      const text = await provider.generateText({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Please process these subtitles and return JSON:\n\n${jsonInput}`,
        temperature: 0.1,
      });

      // Extract JSON block safely
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedArray = JSON.parse(jsonMatch[0]);
        
        for (const item of parsedArray) {
          if (!item.source_ids || !Array.isArray(item.source_ids) || item.source_ids.length === 0) continue;
          
          // Only process items where the FIRST source_id hasn't been processed yet
          // This elegantly handles the sliding window overlap
          const firstId = item.source_ids[0];
          if (processedIds.has(firstId)) continue;
          
          // Mark all source_ids in this item as processed
          item.source_ids.forEach((id: number) => processedIds.add(id));
          
          // Map to exact timestamps to prevent LLM hallucination and drifting
          const sources = item.source_ids
            .map((id: number) => chunk.find(s => s.ref_id === id))
            .filter(Boolean);
            
          if (sources.length > 0) {
            finalSegments.push({
              job_id: jobId,
              start_time_ms: sources[0].start_time_ms,
              end_time_ms: sources[sources.length - 1].end_time_ms,
              text: item.text
            });
          }
        }
      } else {
        console.warn(`[Job ${jobId}] Failed to extract JSON from chunk ${i}. Falling back.`);
        // Fallback for this chunk (only for unprocessed IDs)
        for (const s of chunk) {
          if (!processedIds.has(s.ref_id)) {
            processedIds.add(s.ref_id);
            finalSegments.push({
              job_id: jobId,
              start_time_ms: s.start_time_ms,
              end_time_ms: s.end_time_ms,
              text: s.text
            });
          }
        }
      }
    } catch (err) {
      console.error(`[Job ${jobId}] Error processing chunk ${i}:`, err);
      // Fallback
      for (const s of chunk) {
        if (!processedIds.has(s.ref_id)) {
          processedIds.add(s.ref_id);
          finalSegments.push({
            job_id: jobId,
            start_time_ms: s.start_time_ms,
            end_time_ms: s.end_time_ms,
            text: s.text
          });
        }
      }
    }
  }

  // Sort by start_time_ms to ensure correct ordering
  finalSegments.sort((a, b) => a.start_time_ms - b.start_time_ms);
  return finalSegments;
}
