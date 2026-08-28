-- Migration: Add Playlists and Public Media Assets
-- Date: 2026-08-28

-- 1. Create playlists table
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modify media_assets
ALTER TABLE media_assets 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL;

-- 3. RLS for playlists
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Everyone can read playlists
CREATE POLICY "Playlists are visible to all" ON playlists 
FOR SELECT USING (true);

-- Only admins can CRUD playlists (for now, we'll allow all authenticated users in this prototype or rely on backend admin routes)
CREATE POLICY "Playlists can be managed by authenticated users" ON playlists 
FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Update RLS for media_assets to allow reading public ones
-- Drop old SELECT policy if exists and recreate or add new one
CREATE POLICY "Public media assets are visible to all" ON media_assets 
FOR SELECT USING (is_public = true);

-- Note: The existing "Users can CRUD own media" handles user's private media. 
-- The new policy allows SELECT on public ones.
