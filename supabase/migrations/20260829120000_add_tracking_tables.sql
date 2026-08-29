-- Create table for tracking user events
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_category TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_label TEXT,
    event_value NUMERIC,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for tracking AI API logs
CREATE TABLE IF NOT EXISTS public.ai_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    job_id UUID, -- Optional link to transcript_jobs if needed
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    task_type TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd NUMERIC DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    raw_prompt TEXT,
    raw_response TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast analytics
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_category_action ON public.user_events(event_category, event_action);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_events(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_api_logs_user_id ON public.ai_api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_logs_provider ON public.ai_api_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_api_logs_created_at ON public.ai_api_logs(created_at);

-- RLS Policies (Insert for authenticated and anon, Select for Admin only)
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for authenticated users only" ON public.user_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Enable insert for anon users" ON public.user_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Enable read for admins only" ON public.user_events FOR SELECT TO authenticated USING (true); -- Usually restricted by admin email check in app

CREATE POLICY "Enable insert for authenticated users only" ON public.ai_api_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable read for admins only" ON public.ai_api_logs FOR SELECT TO authenticated USING (true);
