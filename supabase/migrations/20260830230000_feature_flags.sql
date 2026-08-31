-- Migration: Feature Flags table
-- Created: 2026-08-30

CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    allowed_emails TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Seed initial flags
INSERT INTO public.feature_flags (key, name, description, enabled, rollout_percentage) VALUES
    ('shadowing_playlist', 'Shadowing Playlist', 'Cho phép tạo và chia sẻ playlist shadowing', true, 100),
    ('fsrs_review', 'FSRS Review Engine', 'Thuật toán ôn tập thẻ ghi nhớ FSRS', true, 100),
    ('grammar_extraction', 'Grammar AI Extraction', 'Trích xuất ngữ pháp tự động bằng AI', true, 100),
    ('realtime_dashboard', 'Realtime Admin Dashboard', 'Dashboard thời gian thực với Supabase Realtime', true, 100),
    ('analytics_page', 'User Analytics Page', 'Trang phân tích học tập cho người dùng', false, 0),
    ('ai_coach', 'AI Learning Coach', 'Trợ lý AI cá nhân hóa lộ trình học', false, 0),
    ('pronunciation_check', 'Pronunciation Checker', 'Kiểm tra phát âm bằng AI', false, 0),
    ('community_decks', 'Community Shared Decks', 'Chia sẻ bộ flashcard với cộng đồng', false, 0)
ON CONFLICT (key) DO NOTHING;

-- RLS: only service role can access (admin only)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.feature_flags FOR ALL USING (true);
