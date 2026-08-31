-- ===================================================================
-- Migration: 20260831100001_user_management_center.sql
-- Thêm các bảng và cột phục vụ User Management Center (Admin)
-- ===================================================================

-- ─── 1. Cập nhật bảng user_stats ─────────────────────────────────────

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS total_tokens_used BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credits_used NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_study_time_seconds BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_study_days INTEGER DEFAULT 0;

-- ─── 2. Cập nhật bảng ai_usage_logs ──────────────────────────────────

ALTER TABLE public.ai_usage_logs
  ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS trace_id TEXT;

-- ─── 3. Tạo bảng user_sessions ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    ip_address TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active_at DESC);

-- ─── 4. Tạo bảng login_history ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    ip_address TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    login_time TIMESTAMPTZ DEFAULT now(),
    logout_time TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id, login_time DESC);

-- ─── 5. Tạo bảng study_history ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.study_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.media_assets(id) ON DELETE CASCADE,
    module TEXT NOT NULL, -- 'shadowing', 'vocabulary', 'grammar', 'flashcards'
    duration_seconds INTEGER DEFAULT 0,
    score NUMERIC(5,2),
    completion_percentage NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_history_user_id ON public.study_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_history_module ON public.study_history(module);

-- ─── 6. Tạo bảng notification_history ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'system', -- 'system', 'billing', 'alert', 'marketing'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id, created_at DESC);

-- ─── 7. Enable RLS (Mặc định cho Admin query thông qua service_role) ───

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Policies (Users can read their own data)
CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own login history" ON public.login_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own study history" ON public.study_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own study history" ON public.study_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON public.notification_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notification_history FOR UPDATE USING (auth.uid() = user_id);
