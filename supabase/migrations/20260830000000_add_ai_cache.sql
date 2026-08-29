CREATE TABLE IF NOT EXISTS public.ai_api_cache (
    hash_key TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'vocabulary' or 'grammar'
    settings_hash TEXT,
    response_json JSONB NOT NULL,
    provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick cleanup
CREATE INDEX IF NOT EXISTS ai_api_cache_created_at_idx ON public.ai_api_cache(created_at);
