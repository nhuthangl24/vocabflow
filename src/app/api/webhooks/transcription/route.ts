import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";
import fs from "fs";
import { extractAudio, chunkAudio } from "@/lib/media/ffmpeg";
import os from "os";
import path from "path";

export const maxDuration = 300; // 5 minutes max duration for Next.js

export async function POST(req: NextRequest) {
  try {
    // Authorization is removed because we call this from the browser.
    // The jobId is a UUID v4 and acts as a capability URL.

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Process asynchronously to prevent Next.js from killing the request (Fire-and-forget)
    processJob(jobId).catch(console.error);

    return NextResponse.json({ status: "processing completed", jobId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processJob(jobId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  let tmpFilePath = "";
  let audioPath = "";
  try {
    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("transcript_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) throw new Error("Job not found");
    if (job.status === "completed" || job.status === "ready") {
      console.log(`Job ${jobId} is already ${job.status}, skipping.`);
      return;
    }

    // Reset status to queued if retrying
    if (job.status !== "queued") {
      await supabase.from("transcript_jobs").update({ status: "queued", error_message: null }).eq("id", jobId);
    }

    // Fetch asset explicitly to avoid join array/object ambiguity
    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", job.media_asset_id)
      .single();
      
    if (assetError || !asset) throw new Error("Asset not found");
    if (!asset.source_url && asset.type === "youtube") throw new Error("Missing YouTube URL");

    let segmentsFromCC: any[] = [];
    let ccText = "";
    if (asset.type === "youtube") {
      try {
        const { YoutubeTranscript } = await import("youtube-transcript");
        
        // Map targetLanguage to ISO code for CC fetching
        let langCode = 'en';
        const tLang = job.settings?.targetLanguage?.toLowerCase() || '';
        if (tLang.includes('chinese') || tLang.includes('trung')) langCode = 'zh';
        else if (tLang.includes('japanese') || tLang.includes('nhật')) langCode = 'ja';
        else if (tLang.includes('korean') || tLang.includes('hàn')) langCode = 'ko';
        else if (tLang.includes('french') || tLang.includes('pháp')) langCode = 'fr';
        else if (tLang.includes('english') || tLang.includes('anh')) langCode = 'en';
        
        try {
          // Attempt to fetch specific language
          const transcriptArr = await YoutubeTranscript.fetchTranscript(asset.source_url, { lang: langCode });
          if (transcriptArr && transcriptArr.length > 0) {
            segmentsFromCC = transcriptArr.map(t => ({
              job_id: jobId,
              start_time_ms: Math.floor(t.offset),
              end_time_ms: Math.floor(t.offset + t.duration),
              text: t.text
            }));
          } else {
             throw new Error("Empty CC");
          }
        } catch (langError) {
          console.warn(`CC for lang ${langCode} not found. Trying default CC...`);
          try {
            // Fallback: try fetching without any specific language (gets default)
            const fallbackArr = await YoutubeTranscript.fetchTranscript(asset.source_url);
            if (fallbackArr && fallbackArr.length > 0) {
              segmentsFromCC = fallbackArr.map(t => ({
                job_id: jobId,
                start_time_ms: Math.floor(t.offset),
                end_time_ms: Math.floor(t.offset + t.duration),
                text: t.text
              }));
            } else {
              throw new Error("Empty default CC");
            }
          } catch (fallbackError) {
            console.warn(`Default CC also failed. Falling back to Whisper ASR.`);
            throw fallbackError;
          }
        }
      } catch (ccError) {
        console.warn("Could not fetch valid CC, falling back to Whisper:", ccError);
      }
    }

    let allSegments: any[] = [];

    // If we have CC, we skip extraction and transcribing completely!
    if (ccText) {
      // Just mock one big segment
      allSegments.push({
        job_id: jobId,
        start_time_ms: 0,
        end_time_ms: 0, // We don't have exact segment times for MVP in this block, or we could map them.
        text: ccText,
      });
      await supabase.from("transcript_jobs").update({ status: "analyzing" }).eq("id", jobId);
    } else {
      // If we got CCs, skip Whisper completely!
    if (segmentsFromCC.length > 0) {
      console.log(`Skipping Whisper, using ${segmentsFromCC.length} CC segments.`);
      allSegments = segmentsFromCC;
    } else {
    // Update status to extracting_audio
      await supabase.from("transcript_jobs").update({ status: "extracting_audio" }).eq("id", jobId);

      // Download file from Supabase Storage or YouTube
      if (asset.type === "youtube") {
        tmpFilePath = path.join(os.tmpdir(), `dl_${Date.now()}_${asset.id}.m4a`);
        
        await new Promise<void>((resolve, reject) => {
          const { execFile } = require('child_process');
          const args = [
            asset.source_url,
            '--output', tmpFilePath,
            '--format', 'bestaudio[ext=m4a]/bestaudio/best',
            '--no-warnings'
          ];
          
          execFile('yt-dlp', args, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error("yt-dlp error:", stderr);
              reject(new Error("Failed to download youtube video with yt-dlp"));
            } else {
              resolve();
            }
          });
        });
      } else {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("media")
          .download(asset.storage_path);

        if (downloadError) throw downloadError;

        // Save locally
        const buffer = await fileData.arrayBuffer();
        tmpFilePath = path.join(os.tmpdir(), `dl_${Date.now()}_${asset.id}`);
        fs.writeFileSync(tmpFilePath, Buffer.from(buffer));
      }

      audioPath = tmpFilePath;
      
      // Extract audio if it's a video or youtube
      if (asset.type === "video" || asset.type === "youtube") {
        audioPath = await extractAudio(tmpFilePath);
      }

      // Chunk audio
      const chunks = await chunkAudio(audioPath, 600); // 10 minutes

      // Update status to transcribing
      await supabase.from("transcript_jobs").update({ status: "transcribing" }).eq("id", jobId);

      let offsetMs = 0;

      for (const chunk of chunks) {
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(chunk),
          model: process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo",
          response_format: "verbose_json",
          timestamp_granularities: ["segment"],
        });

        // @ts-ignore
        const segments = transcription.segments || [];
        for (const seg of segments) {
          allSegments.push({
            job_id: jobId,
            start_time_ms: Math.floor((seg.start * 1000) + offsetMs),
            end_time_ms: Math.floor((seg.end * 1000) + offsetMs),
            text: seg.text,
          });
        }
        
        offsetMs += 600000;
        fs.unlinkSync(chunk);
      }
    }

    }

    // Check if we should skip AI extraction
    const isShadowing = job.settings?.module === 'shadowing';

    // Apply AI Subtitle Cleaner ONLY for Shadowing videos
    if (isShadowing && allSegments.length > 0) {
      console.log(`[Job ${jobId}] Running Subtitle Editor AI on ${allSegments.length} segments...`);
      try {
        const { cleanSubtitles } = await import("@/lib/ai/subtitle_editor");
        const cleanedSegments = await cleanSubtitles(allSegments, job.user_id);
        console.log(`[Job ${jobId}] Subtitle Editor finished. Output segments: ${cleanedSegments.length}`);
        allSegments = cleanedSegments;
      } catch (err) {
        console.error(`[Job ${jobId}] Subtitle Editor AI failed. Falling back to original segments.`, err);
      }
    }

    // Save segments to DB
    if (allSegments.length > 0) {
      await supabase.from("transcript_segments").insert(allSegments);
    }

    // Update status to analyzing
    await supabase.from("transcript_jobs").update({ status: "analyzing" }).eq("id", jobId);
    
    if (!isShadowing) {
          // Call LLM Extractor
          const { extractVocabulary } = await import("@/lib/ai/extractor");
          const fullTranscript = allSegments.map(s => s.text).join(" ");
          
          // Fetch real user plan to determine limits
          const { data: userData } = await supabase.auth.admin.getUserById(job.user_id);
          const userPlan = (userData?.user?.user_metadata?.plan || 'free').toLowerCase();
          let MAX_ALLOWED = 20; // free limit
          if (userPlan === 'basic') MAX_ALLOWED = 50;
          if (userPlan === 'pro') MAX_ALLOWED = 100;
          
          const requestedCount = job.settings?.targetCount ? Number(job.settings.targetCount) : 35;
          const MAX_WORDS = Math.min(requestedCount, MAX_ALLOWED);
          
          const { RateLimiter, withRetry, withTimeout } = await import("@/lib/ai/utils");
          const { AIConfig } = await import("@/lib/ai/config");
          const { getCachedExtraction, setCachedExtraction, generateCacheKey } = await import("@/lib/ai/cache");
          
          // 1. Token-aware Chunking based on Segments & Safe Word Count
          const SAFE_WORDS_PER_CHUNK = AIConfig.chunking.safeWordsPerChunk || 15;
          const minChunksForWords = Math.ceil(MAX_WORDS / SAFE_WORDS_PER_CHUNK);
          const minChunksForLength = Math.ceil(fullTranscript.length / AIConfig.chunking.maxCharsPerChunk);
          const totalChunksNeeded = Math.max(minChunksForWords, minChunksForLength, 1);
          const targetCharsPerChunk = Math.ceil(fullTranscript.length / totalChunksNeeded);

          const transcriptChunks: string[] = [];
          let currentChunkText = "";
          
          for (const segment of allSegments) {
            // Cut if it exceeds target length AND we haven't reached the max allowed chunks
            // (To avoid creating tiny chunks at the end)
            if (currentChunkText.length + segment.text.length > targetCharsPerChunk && currentChunkText.length > 0 && transcriptChunks.length < totalChunksNeeded - 1) {
              transcriptChunks.push(currentChunkText.trim());
              currentChunkText = "";
            }
            currentChunkText += segment.text + " ";
          }
          if (currentChunkText.trim().length > 0) {
            transcriptChunks.push(currentChunkText.trim());
          }
      
          const wordsPerChunk = Math.ceil(MAX_WORDS / transcriptChunks.length);
          
          const vocabProviderStr = (process.env.VOCAB_PROVIDER || 'hhtech').toLowerCase();
          const chunkSettings = { ...job.settings, targetCount: wordsPerChunk, providerName: vocabProviderStr };
          
          const startTime = performance.now();
          
          // Configure Rate Limiter (Fallback to default if provider not explicitly mapped)
          // In real production, we can check `chunkSettings.provider`
          const concurrencyLimit = (AIConfig.concurrency as any)[vocabProviderStr] || AIConfig.concurrency.default;
          const vocabRateLimiter = new RateLimiter(concurrencyLimit);
          const grammarRateLimiter = new RateLimiter(concurrencyLimit);

          // 2. GRAMMAR PROMISE (Parallel execution with Retry & Cache)
          const grammarPromise = (async () => {
            try {
              const { extractGrammar } = await import("@/lib/ai/grammar_extractor");
              const grammarTargetText = fullTranscript.length > 60000 ? fullTranscript.substring(0, 60000) : fullTranscript;
              const grammarTargetCount = 10;
              const grammarProviderStr = (process.env.GRAMMAR_PROVIDER || 'hhtech').toLowerCase();
              const gSettings = { ...job.settings, targetCount: grammarTargetCount, providerName: grammarProviderStr };
              
              const cacheKey = generateCacheKey(grammarTargetText, gSettings, "grammar");
              const cached = await getCachedExtraction(cacheKey);
              if (cached) return cached;

              const executeGrammar = () => extractGrammar(grammarTargetText, gSettings);
              const extractionPromise = withRetry(executeGrammar, AIConfig.retry);
              
              // Apply rate limit and timeout
              const grammarExtraction = await grammarRateLimiter.run(() => withTimeout(extractionPromise, AIConfig.timeout.extractionMs));
              const grammarItems = grammarExtraction?.items || [];
              
              const results = grammarItems.map((item: any) => ({
                job_id: jobId,
                user_id: job.user_id,
                grammar_pattern: item.grammarPattern,
                level: item.level,
                meaning_vi: item.meaningVi,
                explanation_vi: item.explanationVi,
                original_sentence: item.originalSentence,
                sentence_translation_vi: item.sentenceTranslationVi,
                examples: item.examples,
                confidence: item.confidence ? Number(item.confidence) : 1.0,
              }));
              
              if (results.length > 0) {
                await setCachedExtraction(cacheKey, "grammar", gSettings, results, grammarProviderStr);
              }
              return results;
            } catch (gErr) {
              console.error(`[Job ${jobId}] Failed to extract grammar:`, gErr);
              return [];
            }
          })();

          // 3. VOCABULARY PROMISE (Parallel execution of Chunks with Retry, Cache & Order preservation)
          const vocabPromise = (async () => {
            const chunkPromises = transcriptChunks.map((chunk, index) => {
              return vocabRateLimiter.run(async () => {
                const chunkStartTime = performance.now();
                const cacheKey = generateCacheKey(chunk, chunkSettings, "vocabulary");
                
                try {
                  const cached = await getCachedExtraction(cacheKey);
                  if (cached) {
                    console.log(`[Job ${jobId}][Vocab Chunk ${index + 1}/${transcriptChunks.length}] ⚡ CACHE HIT`);
                    return { items: cached, chunkText: chunk, success: true };
                  }

                  const executeVocab = () => extractVocabulary(chunk, chunkSettings);
                  const extractionPromise = withRetry(executeVocab, AIConfig.retry);
                  
                  const extraction = await withTimeout(extractionPromise, AIConfig.timeout.extractionMs);
                  const items = extraction?.items || [];
                  
                  if (items.length > 0) {
                     await setCachedExtraction(cacheKey, "vocabulary", chunkSettings, items, vocabProviderStr);
                  }
                  
                  const chunkDuration = ((performance.now() - chunkStartTime) / 1000).toFixed(2);
                  console.log(`[Job ${jobId}][Vocab Chunk ${index + 1}/${transcriptChunks.length}] ✅ Success | ${items.length} items | ${chunkDuration}s`);
                  
                  return { items, chunkText: chunk, success: true };
                } catch (e: any) {
                  const chunkDuration = ((performance.now() - chunkStartTime) / 1000).toFixed(2);
                  console.error(`[Job ${jobId}][Vocab Chunk ${index + 1}/${transcriptChunks.length}] ❌ Failed after retries | ${chunkDuration}s`, e.message);
                  return { items: [], chunkText: chunk, success: false };
                }
              });
            });
            
            // Promise.all preserves the original array order!
            const chunksResults = await Promise.all(chunkPromises);
            
            let allVocabItems: any[] = [];
            let failedChunksText: string[] = [];
            
            for (const result of chunksResults) {
              if (result.success && result.items.length > 0) {
                allVocabItems = allVocabItems.concat(result.items);
              } else if (!result.success) {
                failedChunksText.push(result.chunkText);
              }
            }
      
            allVocabItems = allVocabItems.slice(0, MAX_WORDS);
            
            return {
              formattedItems: allVocabItems.map(item => ({
              job_id: jobId,
              user_id: job.user_id,
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
            })),
            failedChunksText: failedChunksText
          };
          })();

          // AWAIT BOTH IN PARALLEL
          const [grammarInserts, vocabResult] = await Promise.all([grammarPromise, vocabPromise]);
          const vocabInserts = vocabResult.formattedItems;
          const failedChunks = vocabResult.failedChunksText;
          
          if (grammarInserts && grammarInserts.length > 0) {
            console.log(`[Job ${jobId}][Grammar] ✅ Success | ${grammarInserts.length} items`);
          }

          const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(`[Job ${jobId}] 🎉 AI Extraction Completed in ${totalDuration}s`);
      
          // INSERT INTO DATABASE
          if (vocabInserts && vocabInserts.length > 0) {
            await supabase.from("vocabulary_items").insert(vocabInserts);
          }
          if (grammarInserts && grammarInserts.length > 0) {
            await supabase.from("grammar_items").insert(grammarInserts);
          }
      
          // Mark as completed
          await supabase.from("transcript_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", jobId);
          await supabase.from("media_assets").update({ status: "ready" }).eq("id", asset.id);

          // FIRE AND FORGET BACKGROUND RETRY
          if (failedChunks && failedChunks.length > 0) {
            console.log(`[Job ${jobId}] 🔥 Triggering background retry for ${failedChunks.length} failed chunks...`);
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            fetch(`${baseUrl}/api/internal/retry-chunks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jobId,
                userId: job.user_id,
                chunks: failedChunks,
                settings: chunkSettings,
              })
            }).catch(e => console.error(`[Job ${jobId}] Failed to trigger background retry:`, e));
          }
      
    }
    
    // Cleanup
    if (fs.existsSync(/*turbopackIgnore: true*/ tmpFilePath)) fs.unlinkSync(tmpFilePath);
    if (audioPath !== tmpFilePath && fs.existsSync(/*turbopackIgnore: true*/ audioPath)) fs.unlinkSync(audioPath);

  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);
    await supabase.from("transcript_jobs").update({ 
      status: "failed", 
      error_message: error.message 
    }).eq("id", jobId);
    
    // Also update media_asset status so UI knows it failed
    if (jobId) {
       // get asset id first if we don't have it (we might have failed before fetching it)
       try {
         const { data: failJob } = await supabase.from("transcript_jobs").select("media_asset_id").eq("id", jobId).single();
         if (failJob && failJob.media_asset_id) {
           await supabase.from("media_assets").update({ status: "failed" }).eq("id", failJob.media_asset_id);
         }
       } catch (e) {}
    }

    if (tmpFilePath && fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
  }
}
