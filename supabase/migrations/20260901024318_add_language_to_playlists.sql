-- Add language field to playlists for categorization
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS language text DEFAULT 'English';

-- Update the "Speak English With Class" playlist to English
UPDATE playlists SET language = 'English' WHERE title ILIKE '%Speak English%' OR title ILIKE '%English%';

-- Create index for filtering by language
CREATE INDEX IF NOT EXISTS idx_playlists_language ON playlists(language);
