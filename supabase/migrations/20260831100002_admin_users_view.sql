-- ===================================================================
-- Migration: 20260831100002_admin_users_view.sql
-- Tạo view tổng hợp thông tin user cho Admin Dashboard
-- ===================================================================

CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    u.id,
    u.email,
    u.created_at AS registered_at,
    u.last_sign_in_at,
    u.raw_user_meta_data->>'full_name' AS full_name,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url,
    u.banned_until,
    COALESCE((
        SELECT p.name 
        FROM public.subscriptions s 
        JOIN public.plans p ON s.plan_id = p.id 
        WHERE s.user_id = u.id AND s.status = 'active' 
        ORDER BY s.created_at DESC LIMIT 1
    ), 'FREE') AS current_plan,
    st.total_tokens_used,
    st.total_credits_used,
    st.total_study_time_seconds,
    st.total_study_days,
    st.current_streak,
    (
        SELECT COUNT(*) FROM public.media_assets m WHERE m.user_id = u.id
    ) AS total_videos,
    (
        SELECT COUNT(*) FROM public.study_history sh WHERE sh.user_id = u.id
    ) AS total_sessions,
    (
        SELECT us.country FROM public.user_sessions us WHERE us.user_id = u.id ORDER BY us.last_active_at DESC LIMIT 1
    ) AS last_country,
    (
        SELECT us.last_active_at FROM public.user_sessions us WHERE us.user_id = u.id ORDER BY us.last_active_at DESC LIMIT 1
    ) AS last_active_at
FROM auth.users u
LEFT JOIN public.user_stats st ON u.id = st.user_id;

-- Ensure only authenticated users with admin role or service_role can access it
-- (Views bypass RLS by default if created by postgres, but we should secure it if we query via anon)
-- To be safe, we will just query this view using the service_role key in our admin API.
GRANT SELECT ON public.admin_users_view TO service_role;
