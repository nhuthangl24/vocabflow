-- Migration: Update Pricing Plans (Chuẩn hóa)

-- 1. Xóa các plan cũ (Tránh trùng lặp)
DELETE FROM public.plans;

-- 2. Thêm lại cấu trúc chuẩn
INSERT INTO public.plans (
    name, 
    description, 
    monthly_transcription_minutes, 
    monthly_video_count, 
    max_vocabulary_per_video, 
    max_decks, 
    max_upload_bytes, 
    retention_days, 
    price_usd, 
    is_recommended, 
    daily_video_limit, 
    max_video_duration_minutes, 
    enable_shadowing
)
VALUES 
(
    'free', 
    'Gói miễn phí cho người mới bắt đầu', 
    30, 3, 20, 5, 104857600, 7, 
    0, false, 3, 10, false
),
(
    'basic', 
    'Gói tiêu chuẩn (Khuyên dùng)', 
    600, 30, 100, 9999, 524288000, 90, 
    59000, true, 20, 30, true
),
(
    'pro', 
    'Gói không giới hạn', 
    3000, 999, 500, 9999, 2147483648, 365, 
    149000, false, 999, 60, true
);
