-- ==============================================================================
-- Migration: Enforce RLS on ai_api_cache
-- Description: Ensures the cache table is protected by RLS
-- ==============================================================================

ALTER TABLE public.ai_api_cache ENABLE ROW LEVEL SECURITY;

-- Since this table is strictly managed by backend service roles, we can deny all public access
CREATE POLICY "Deny all public access to ai_api_cache"
    ON public.ai_api_cache
    FOR ALL
    USING (false);

-- Note: The backend uses the service_role key to bypass RLS, which is the correct pattern.
