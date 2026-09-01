-- Create a ban log table to track devtools violations
CREATE TABLE IF NOT EXISTS public.user_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    banned_until TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT
);
-- Update RLS for user_bans
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all bans" ON public.user_bans FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@luminastudy.site', 'nhuthangl24@gmail.com'));
