import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractVocabulary } from "@/lib/ai/extractor";
import { withRetry, withTimeout } from "@/lib/ai/utils";
import { AIConfig } from "@/lib/ai/config";

// Force Node.js runtime instead of Edge to avoid harsh timeouts
export const maxDuration = 300; // 5 minutes max duration

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, userId, chunks, settings } = body;

    if (!jobId || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log(`[Retry-Background] 🚀 Bắt đầu cứu hộ ${chunks.length} chunks cho Job ${jobId}...`);

    // We MUST use the service role key to insert securely in background without auth context
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Process each failed chunk sequentially (safe fallback strategy)
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      try {
        console.log(`[Retry-Background] Tiêm chunk ${i + 1}/${chunks.length}...`);
        
        // Always force a more reliable provider for retry if possible
        const executeVocab = () => extractVocabulary(chunkText, settings);
        
        // We give it a generous timeout (e.g. 200s)
        const extractionPromise = withRetry(executeVocab, AIConfig.retry);
        const extraction = await withTimeout(extractionPromise, 200000);
        
        const items = extraction?.items || [];
        
        if (items.length > 0) {
          const formattedItems = items.map((item: any) => ({
            job_id: jobId,
            user_id: userId,
            term: item.term,
            lemma: item.lemma,
            pronunciation: item.pronunciation,
            part_of_speech: item.partOfSpeech,
            level: item.level,
            meaning_vi: item.meaningVi,
            context_meaning_vi: item.contextMeaningVi,
            original_sentence: item.originalSentence,
            sentence_translation_vi: item.sentenceTranslationVi,
            usage_note_vi: item.usageNoteVi,
            examples: item.examples,
            collocations: item.collocations,
            synonyms: item.synonyms,
            antonyms: item.antonyms,
            word_family: item.wordFamily,
            related_words: item.relatedWords,
            common_mistakes_vi: item.commonMistakesVi,
            tags: item.tags,
            confidence: item.confidence ? Number(item.confidence) : 1.0,
            simplified: item.simplified,
            traditional: item.traditional,
            pinyin: item.pinyin,
            measure_words: item.measureWords,
            hsk_level: item.hskLevel ? Number(item.hskLevel) : null,
          }));

          // Insert directly into DB
          const { error } = await supabase.from("vocabulary_items").insert(formattedItems);
          if (error) {
            console.error(`[Retry-Background] Lỗi insert DB Chunk ${i + 1}:`, error);
          } else {
            console.log(`[Retry-Background] ✅ Cứu thành công Chunk ${i + 1} (${items.length} từ)`);
          }
        }
      } catch (err: any) {
        console.error(`[Retry-Background] ❌ Chunk ${i + 1} vẫn thất bại:`, err.message);
        // Continue to the next chunk even if this one fails
      }
    }

    console.log(`[Retry-Background] 🎉 Hoàn tất quá trình cứu hộ cho Job ${jobId}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Retry-Background] Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
