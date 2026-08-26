# VocabFlow

VocabFlow is an AI-powered language learning platform that extracts vocabulary from videos, audio, and subtitles.

## 🚀 Features

- **Media Upload**: Upload video/audio or subtitles to process.
- **AI Transcription**: Uses Groq Whisper (or standard Whisper) to generate precise, timestamped transcripts from audio.
- **Smart Vocabulary Extraction**: Uses LLMs (OpenAI or Anthropic compatible) to extract high-value vocabulary items (idioms, collocations, phrasal verbs) based on CEFR levels, complete with Vietnamese context translations and examples.
- **Video Workspace**: Interactive video player that highlights terms and lets you jump to specific timestamps.
- **Spaced Repetition (SRS)**: Built-in flashcard system using SM-2 algorithm for long-term retention.
- **Usage & Quotas**: Real-time quota tracking per user plan (Free, Basic, Pro).

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions & Route Handlers
- **Database & Auth**: Supabase (PostgreSQL, GoTrue, Storage)
- **Media**: Node.js `fluent-ffmpeg` & `ffmpeg-static`
- **AI**: Groq SDK, standard OpenAI SDK (for LLM abstraction)

## 📦 Local Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Supabase Setup**
   - Create a Supabase project.
   - Run the SQL migration located at `supabase/migrations/20260826000000_init.sql` in your Supabase SQL Editor.
   - Set up the Storage bucket named `media` (handled in the SQL script).

3. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase URL/Keys, Groq API Key, and LLM Provider Keys.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture Decisions

- **Background Jobs**: For this MVP, background jobs (like Audio extraction -> Whisper -> LLM) are processed via Next.js Route Handlers (`/api/webhooks/transcription`). In a production environment with heavy loads, this should be moved to a robust queue system (like BullMQ) or a dedicated worker service.
- **LLM Abstraction**: We implemented an interface supporting both OpenAI and Anthropic SDKs to avoid vendor lock-in.
- **Usage Ledger**: We use an append-only ledger for AI cost/quota tracking to ensure accuracy and auditability.

## ⚠️ Known Risks & Limitations

- Free Vercel/Next.js hosting has strict function timeouts (10-60s) which will cause the transcription pipeline to fail for long videos. Ensure `maxDuration` is supported by your plan, or deploy via Docker/VPS.
- FFmpeg relies on `ffmpeg-static` which downloads the binary for the host OS. This is generally safe but might have issues on Alpine Linux or specialized containers.
