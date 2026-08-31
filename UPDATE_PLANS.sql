TRUNCATE TABLE public.plans CASCADE;
INSERT INTO public.plans (name, description, monthly_transcription_minutes, monthly_video_count, max_vocabulary_per_video, max_decks, max_upload_bytes, retention_days, price_usd, is_recommended, daily_video_limit, max_video_duration_minutes, enable_shadowing)
VALUES 
('free', 'Gói miễn phí trải nghiệm', 15, 3, 20, 5, 104857600, 7, 0, false, 2, 5, false),
('plus', 'Gói khuyên dùng học sinh/sinh viên', 600, 30, 50, 9999, 524288000, 90, 49000, true, 10, 20, true),
('pro', 'Gói siêu cấp cày cuốc', 3000, 999, 100, 9999, 2147483648, 365, 149000, false, 999, 60, true);
