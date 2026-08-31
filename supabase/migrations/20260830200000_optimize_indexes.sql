-- Phase P0: Database Index Optimization for Enterprise Scale
-- These indexes will speed up the extraction pipeline and user workspace loading.

-- 1. Index for vocabulary_items
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_job_id ON public.vocabulary_items(job_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_user_id ON public.vocabulary_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_media_asset_id ON public.vocabulary_items(media_asset_id);

-- 2. Index for grammar_items
CREATE INDEX IF NOT EXISTS idx_grammar_items_job_id ON public.grammar_items(job_id);
CREATE INDEX IF NOT EXISTS idx_grammar_items_user_id ON public.grammar_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_items_media_asset_id ON public.grammar_items(media_asset_id);

-- 3. Index for transcript_segments
CREATE INDEX IF NOT EXISTS idx_transcript_segments_media_asset_id ON public.transcript_segments(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_job_id ON public.transcript_segments(job_id);

-- 4. Index for media_assets and transcript_jobs to speed up status lookups
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON public.media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON public.media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_transcript_jobs_media_asset_id ON public.transcript_jobs(media_asset_id);
