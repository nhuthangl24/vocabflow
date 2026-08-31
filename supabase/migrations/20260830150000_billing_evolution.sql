-- Migration: Billing System Evolution (SaaS Level)

-- 1. Cập nhật bảng payment_settings
ALTER TABLE public.payment_settings ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Cập nhật dòng hiện tại thành mặc định
UPDATE public.payment_settings SET is_default = TRUE WHERE is_active = TRUE;

-- 2. Cập nhật bảng orders
-- Xóa check constraint cũ nếu có
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Thêm check constraint mới hỗ trợ 12 trạng thái
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'waiting_payment', 'transferred', 'waiting_approval', 'approved', 'rejected', 'expired', 'cancelled', 'refunded', 'failed', 'duplicate', 'unknown'));

-- Thêm cột admin_note
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- 3. Tạo bảng order_logs (Audit Log & Timeline)
CREATE TABLE IF NOT EXISTS public.order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User thực hiện hoặc Admin, NULL nếu tự động
    action_type TEXT NOT NULL, -- e.g. 'created', 'qr_generated', 'approved', 'rejected', 'refunded', 'note_added'
    description TEXT,
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho Timeline
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON public.order_logs(order_id);

-- RLS cho order_logs
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- User chỉ đọc được log của order mà họ sở hữu
    CREATE POLICY "Users can read own order logs" ON public.order_logs
    FOR SELECT USING (
        order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    );

    -- Bổ sung Policy cho User insert log (ví dụ lúc mở QR)
    CREATE POLICY "Users can insert own order logs" ON public.order_logs
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
