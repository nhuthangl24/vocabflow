-- Migration: Payment System (QR Bank Transfer)
-- Bảng orders quản lý giao dịch nạp tiền/nâng cấp
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- 'pro_monthly', 'pro_yearly', 'lifetime'
    amount BIGINT NOT NULL,
    currency TEXT DEFAULT 'VND',
    bank_code TEXT,
    account_number TEXT,
    account_name TEXT,
    transfer_content TEXT NOT NULL UNIQUE, -- VD: VF8KQ2
    random_code TEXT,
    qr_image TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'waiting', 'paid', 'approved', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng cấu hình cổng thanh toán cho Admin
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    qr_image_url TEXT,
    support_contact TEXT,
    payment_timeout_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed mặc định cho Payment Settings
INSERT INTO public.payment_settings (bank_code, account_number, account_name, support_contact)
VALUES ('MBBANK', '123456789', 'NGUYEN VAN A', 'hotro@vocabflow.com')
ON CONFLICT DO NOTHING;

-- Thêm Indexes cho Orders để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_transfer_content ON public.orders(transfer_content);

-- Phân quyền RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Users chỉ có thể xem order của chính họ
CREATE POLICY "Users can read own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

-- Users có thể tạo order
CREATE POLICY "Users can insert own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment settings chỉ được đọc bởi mọi người (để hiển thị QR), sửa bởi Admin
CREATE POLICY "Anyone can read active payment settings" ON public.payment_settings
FOR SELECT USING (is_active = true);
