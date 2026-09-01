-- VOUCHERS
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_discount NUMERIC(10, 2),
    min_order NUMERIC(10, 2),
    usage_limit INT,
    usage_per_user INT DEFAULT 1,
    used_count INT DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    conditions JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- VOUCHER USAGE
CREATE TABLE IF NOT EXISTS public.voucher_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT,
    discount_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(voucher_id, user_id, order_id)
);

-- UPDATE PLANS
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cycle TEXT DEFAULT 'monthly' CHECK (cycle IN ('monthly', 'yearly', 'lifetime', 'daily', 'weekly')),
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#4f46e5',
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Zap',
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'hidden')),
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INT DEFAULT 0;

-- PLAN FEATURES
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    UNIQUE(plan_id, feature_key)
);

-- PLAN LIMITS
CREATE TABLE IF NOT EXISTS public.plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    limit_key TEXT NOT NULL,
    limit_value NUMERIC NOT NULL,
    UNIQUE(plan_id, limit_key)
);

-- UPDATE SUBSCRIPTIONS
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- USER PLAN HISTORY
CREATE TABLE IF NOT EXISTS public.user_plan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_plan_id UUID REFERENCES public.plans(id),
    new_plan_id UUID REFERENCES public.plans(id),
    reason TEXT,
    admin_id UUID REFERENCES auth.users(id),
    voucher_id UUID REFERENCES public.vouchers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('system', 'promotion', 'voucher', 'maintenance', 'feature', 'warning', 'billing', 'personal')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_text TEXT,
    target_users JSONB DEFAULT '{"type": "all"}'::jsonb, -- e.g. {"type": "all"}, {"type": "plan", "plan_id": "uuid"}, {"type": "users", "user_ids": ["uuid"]}
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATION READS
CREATE TABLE IF NOT EXISTS public.notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_dismissed BOOLEAN DEFAULT false,
    UNIQUE(notification_id, user_id)
);

-- RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admin full access vouchers" ON public.vouchers FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
CREATE POLICY "Admin full access usage" ON public.voucher_usage FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
CREATE POLICY "Admin full access features" ON public.plan_features FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
CREATE POLICY "Admin full access limits" ON public.plan_limits FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
CREATE POLICY "Admin full access history" ON public.user_plan_history FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
CREATE POLICY "Admin full access notifications" ON public.notifications FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
CREATE POLICY "Admin full access reads" ON public.notification_reads FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));

-- Users can view active vouchers
CREATE POLICY "Users can view active vouchers" ON public.vouchers FOR SELECT USING (status = 'active');

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.voucher_usage FOR SELECT USING (user_id = auth.uid());

-- Everyone can view plan features and limits
CREATE POLICY "Everyone can view plan features" ON public.plan_features FOR SELECT USING (true);
CREATE POLICY "Everyone can view plan limits" ON public.plan_limits FOR SELECT USING (true);

-- Users can view their own history
CREATE POLICY "Users can view own history" ON public.user_plan_history FOR SELECT USING (user_id = auth.uid());

-- Users can view notifications targeted to them (handled in API/query layer, but open SELECT here)
CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT USING (true);

-- Users can manage their own reads
CREATE POLICY "Users can manage own notification reads" ON public.notification_reads FOR ALL USING (user_id = auth.uid());

