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
    // 1. Verify authorization (simple bearer token check)
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Process asynchronously (Note: Next.js might kill this depending on deployment. 
    // Works fine locally or with maxDuration configured).
    processJob(jobId).catch(console.error);

    return NextResponse.json({ status: "processing started", jobId });
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

    // Save segments to DB
    if (allSegments.length > 0) {
      await supabase.from("transcript_segments").insert(allSegments);
    }

    // Update status to analyzing
    await supabase.from("transcript_jobs").update({ status: "analyzing" }).eq("id", jobId);

    // Check if we should skip AI extraction
    const isShadowing = job.settings?.module === 'shadowing';
    
    if (!isShadowing) {
          // Call LLM Extractor
          const { extractVocabulary } = await import("@/lib/ai/extractor");
          const fullTranscript = allSegments.map(s => s.text).join(" ");
          
          // MVP Fake Plan Logic
          const userPlan: string = "free"; 
          const MAX_ALLOWED = userPlan === "pro" ? 50 : 35;
          
          const requestedCount = job.settings?.targetCount ? Number(job.settings.targetCount) : 35;
          const MAX_WORDS = Math.min(requestedCount, MAX_ALLOWED);
          
          // Calculate how many chunks we need to safely extract MAX_WORDS.
          // Assume a safe limit of 15 words per chunk to avoid output truncation.
          const SAFE_WORDS_PER_CHUNK = 15;
          const minChunksForWords = Math.ceil(MAX_WORDS / SAFE_WORDS_PER_CHUNK);
          
          const MAX_CHARS_PER_CHUNK = 12000;
          const minChunksForLength = Math.ceil(fullTranscript.length / MAX_CHARS_PER_CHUNK);
          
          const totalChunksNeeded = Math.max(minChunksForWords, minChunksForLength);
          const actualChunkSize = Math.ceil(fullTranscript.length / totalChunksNeeded);
      
          const transcriptChunks = [];
          if (totalChunksNeeded <= 1) {
            transcriptChunks.push(fullTranscript);
          } else {
            for (let i = 0; i < fullTranscript.length; i += actualChunkSize) {
              transcriptChunks.push(fullTranscript.substring(i, i + actualChunkSize));
            }
          }
      
          const wordsPerChunk = Math.ceil(MAX_WORDS / transcriptChunks.length);
          const chunkSettings = { ...job.settings, targetCount: wordsPerChunk };
      
          let allVocabItems: any[] = [];
          
          const batchSize = 5;
          for (let i = 0; i < transcriptChunks.length; i += batchSize) {
            const batch = transcriptChunks.slice(i, i + batchSize);
            const batchPromises = batch.map(async (tChunk) => {
              try {
                const extraction = await extractVocabulary(tChunk, chunkSettings);
                return extraction?.items || [];
              } catch (e) {
                console.error("Failed to extract vocab for a chunk", e);
                return [];
              }
            });
            
            const batchResults = await Promise.all(batchPromises);
            allVocabItems = allVocabItems.concat(batchResults.flat());
          }
      
          allVocabItems = allVocabItems.slice(0, MAX_WORDS);
      
          // Prepare vocab inserts
          const vocabInserts = allVocabItems.map(item => ({
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
            grammar_pattern: item.grammarPattern,
          }));
      
          if (vocabInserts.length > 0) {
            await supabase.from("vocabulary_items").insert(vocabInserts);
          }
      
          // --- Extract Grammar ---
          try {
            const { extractGrammar } = await import("@/lib/ai/grammar_extractor");
            // Truncate to ~60000 chars if it's too long, to ensure we don't blow up input tokens needlessly
            // 60k chars is about 15k tokens, very safe for modern LLMs.
            const grammarTargetText = fullTranscript.length > 60000 ? fullTranscript.substring(0, 60000) : fullTranscript;
            
            const grammarExtraction = await extractGrammar(grammarTargetText, { ...job.settings, targetCount: 5 });
            const grammarItems = grammarExtraction?.items || [];
            
            const grammarInserts = grammarItems.map(item => ({
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
      
            if (grammarInserts.length > 0) {
              await supabase.from("grammar_items").insert(grammarInserts);
            }
          } catch (gErr) {
            console.error("Failed to extract grammar:", gErr);
            // We don't fail the job if grammar fails, it's an enhancement
          }
      
          // Mark as completed
      
    }
    await supabase.from("transcript_jobs").update({ status: "completed" }).eq("id", jobId);
    await supabase.from("media_assets").update({ status: "ready" }).eq("id", asset.id);

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
