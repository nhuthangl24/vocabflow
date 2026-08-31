-- Migration: Enhance ai_api_logs for full AI observability
-- Created: 2026-08-30

-- Add observability columns to ai_api_logs
ALTER TABLE public.ai_api_logs
  ADD COLUMN IF NOT EXISTS is_retry    BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fallback BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS http_status INTEGER,
  ADD COLUMN IF NOT EXISTS trace_id    TEXT,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER; -- alias for latency_ms (some code uses duration_ms)

-- Sync duration_ms from latency_ms for existing rows
UPDATE public.ai_api_logs SET duration_ms = latency_ms WHERE duration_ms IS NULL AND latency_ms IS NOT NULL;

-- Performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider_created ON public.ai_api_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_model_created    ON public.ai_api_logs(model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_created     ON public.ai_api_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status_created   ON public.ai_api_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created          ON public.ai_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_trace_id         ON public.ai_api_logs(trace_id) WHERE trace_id IS NOT NULL;
