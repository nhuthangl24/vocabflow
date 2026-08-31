-- ===================================================================
-- Migration: 20260831100000_plans_features_library.sql
-- Thêm feature flags đầy đủ cho plans + publish_status cho media_assets
-- ===================================================================

-- ─── 1. Plans: thêm columns mới ──────────────────────────────────────

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly',
  -- Feature toggles
  ADD COLUMN IF NOT EXISTS enable_vocabulary BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_grammar BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_flashcards BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_srs BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_library BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_personal_upload BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_system_library BOOLEAN DEFAULT false,
  -- Limits
  ADD COLUMN IF NOT EXISTS max_storage_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_ai_calls_per_month INTEGER DEFAULT 0;

-- Update existing plans với sort_order và màu mặc định
UPDATE public.plans SET sort_order = 0, color = '#94a3b8' WHERE name = 'FREE';
UPDATE public.plans SET sort_order = 1, color = '#6366f1', badge_text = 'Phổ biến' WHERE name = 'BASIC';
UPDATE public.plans SET sort_order = 2, color = '#f59e0b', badge_text = 'Premium' WHERE name = 'PRO';

-- Enable system library cho PRO plans
UPDATE public.plans SET enable_system_library = true WHERE name IN ('PRO');

-- ─── 2. Media Assets: thêm columns mới ───────────────────────────────

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reprocess_requested_at TIMESTAMPTZ;

-- Backfill: media_assets is_public=true → publish_status='published'
UPDATE public.media_assets SET publish_status = 'published' WHERE is_public = true;
UPDATE public.media_assets SET publish_status = 'draft' WHERE is_public = false;

-- Index mới
CREATE INDEX IF NOT EXISTS idx_media_assets_publish_status ON public.media_assets(publish_status);
CREATE INDEX IF NOT EXISTS idx_media_assets_module_publish ON public.media_assets(module, publish_status);

-- ─── 3. RLS cho admin media management ───────────────────────────────

-- Cho phép admin (service role) update bất kỳ media asset
-- (Dùng service_role client ở server-side API routes, không cần policy thêm)

-- ─── 4. Admin policy cho plans ────────────────────────────────────────

-- Drop old policy nếu có, tạo lại
DROP POLICY IF EXISTS "Admins can modify plans" ON public.plans;

-- Plans: chỉ service_role mới update được (via admin API)
-- SELECT đã public, INSERT/UPDATE/DELETE dùng adminClient (service_role bypass RLS)
