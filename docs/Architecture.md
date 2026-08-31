# VocabFlow Architecture

## System Overview
VocabFlow is a modern, AI-powered language learning platform (SaaS) built on a Monolith Serverless architecture.

## Tech Stack
- **Frontend/Backend:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, GoTrue)
- **Media Processing:** Vercel Serverless (`yt-dlp`, `ffmpeg`)
- **AI Integration:** Multi-provider Strategy (Anthropic, Groq, KiraAI) via custom `FallbackProvider`.

## Core Flows
1. **User Upload:** Users input a YouTube URL or direct video file.
2. **Job Queue:** A record is created in `transcript_jobs` (State Machine: `pending` -> `extracting` -> `transcribing` -> `completed`).
3. **AI Pipeline:**
   - Transcribe: Uses Groq Whisper for fast audio-to-text.
   - Segmentation: Uses *True Action Engine* (LLM + Union-Find algorithm) to merge subtitles logically.
   - Extraction: Extracts Contextual Vocabulary and Grammar rules.

## High Availability & SRE
- The system incorporates a **Circuit Breaker** pattern in the `FallbackProvider` to prevent cascading failures if an upstream AI provider goes down.
- Data fetching uses Server-side Pagination to prevent client-side OOM (Out of Memory) crashes.
- Webhooks are protected by Session and Internal Secrets to prevent unauthorized API cost inflation.

## Future Evolution (Roadmap)
- Migrate heavy Video/Audio processing from Vercel Serverless to a dedicated Node.js Worker (VPS/Docker) polling a Dead Letter Queue (DLQ) Postgres table to prevent 300s timeout errors.
