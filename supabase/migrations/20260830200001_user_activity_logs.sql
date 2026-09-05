-- ==============================================================================
-- Migration: Create User Activity Logs
-- Description: Tracking all user actions for the new User Dashboard
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    device TEXT,
    browser TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast querying by user
CREATE INDEX IF NOT EXISTS user_activity_logs_user_id_idx ON public.user_activity_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own logs
CREATE POLICY "Users can view their own activity logs"
    ON public.user_activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own logs (or system can)
CREATE POLICY "Users can insert their own activity logs"
    ON public.user_activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
