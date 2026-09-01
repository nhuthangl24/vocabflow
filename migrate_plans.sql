INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_vocabulary', enable_vocabulary FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_grammar', enable_grammar FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_flashcards', enable_flashcards FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_srs', enable_srs FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_library', enable_library FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_personal_upload', enable_personal_upload FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_system_library', enable_system_library FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT id, 'enable_shadowing', enable_shadowing FROM public.plans ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'daily_video_limit', daily_video_limit FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_video_duration_minutes', max_video_duration_minutes FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_shadowing_minutes', max_shadowing_minutes FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_vocabulary_per_video', max_vocabulary_per_video FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'monthly_shadowing_limit', monthly_shadowing_limit FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_ai_calls_per_month', max_ai_calls_per_month FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_storage_bytes', max_storage_bytes FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_decks', max_decks FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_flashcards', max_flashcards FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'retention_days', retention_days FROM public.plans ON CONFLICT (plan_id, limit_key) DO NOTHING;

UPDATE public.plans SET slug = LOWER(name) WHERE slug IS NULL;
