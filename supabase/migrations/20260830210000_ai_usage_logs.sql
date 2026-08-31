-- ==============================================================================
-- Migration: Create AI Usage Logs
-- Description: Tracking AI tokens and credits for individual users
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    provider TEXT NOT NULL, -- 'openai', 'gemini', 'anthropic'
    model TEXT NOT NULL,    -- 'gpt-4o', 'gemini-1.5-flash', etc.
    module TEXT NOT NULL,   -- 'transcript', 'vocabulary', 'grammar'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON public.ai_usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own AI usage
CREATE POLICY "Users can view their own ai usage logs"
    ON public.ai_usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- System uses service_role to insert, so no insert policy needed for public.
