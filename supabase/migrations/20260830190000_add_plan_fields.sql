-- Thêm 2 trường mới vào bảng plans
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monthly_shadowing_limit INTEGER DEFAULT 0;

-- Cập nhật gói mẫu (Premium không giới hạn shadowing, basic có 50 lượt/tháng, free = 0)
UPDATE public.plans SET monthly_shadowing_limit = 0 WHERE name = 'premium';
UPDATE public.plans SET monthly_shadowing_limit = 50 WHERE name = 'basic';
UPDATE public.plans SET monthly_shadowing_limit = 0 WHERE name = 'free';
