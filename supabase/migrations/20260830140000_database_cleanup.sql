-- Migration: Database Master Cleanup & Enterprise Hardening
-- Thêm Indexes cho các trường thường xuyên query để tăng tốc độ truy vấn (Performance).

-- 1. Index cho bảng media_assets
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id_created_at ON public.media_assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON public.media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_module ON public.media_assets(module);

-- 2. Index cho bảng vocabulary_items
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_user_id ON public.vocabulary_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_job_id ON public.vocabulary_items(job_id);

-- 3. Index cho bảng grammar_items
CREATE INDEX IF NOT EXISTS idx_grammar_items_user_id ON public.grammar_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_items_job_id ON public.grammar_items(job_id);

-- 4. Index cho bảng transcript_jobs
CREATE INDEX IF NOT EXISTS idx_transcript_jobs_media_asset_id ON public.transcript_jobs(media_asset_id);

-- 5. Bật RLS và củng cố bảo mật (Defense in Depth)
-- Đảm bảo RLS được bật cho mọi bảng.
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 6. Tạo View cho Analytics (Dùng cho Admin Dashboard)
CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT 
    (SELECT count(*) FROM auth.users) as total_users,
    (SELECT count(*) FROM public.media_assets WHERE status = 'ready') as total_videos,
    (SELECT count(*) FROM public.vocabulary_items) as total_vocabularies,
    (SELECT count(*) FROM public.orders WHERE status = 'approved') as total_paid_orders;
