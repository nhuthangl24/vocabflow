-- ==============================================================================
-- Migration: Flashcards Collections Upgrade
-- Description: Adds features to flashcard_decks (Collections) and flashcards 
-- ==============================================================================

-- 1. Upgrade flashcard_decks (Collections)
ALTER TABLE public.flashcard_decks
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS source_language TEXT DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'vi-VN',
ADD COLUMN IF NOT EXISTS total_cards INTEGER DEFAULT 0;

-- Optional: Create index on total_cards if we query it often
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_total_cards ON public.flashcard_decks(total_cards);

-- 2. Upgrade flashcards
-- For manual flashcard creation we want to be able to store rich data natively 
-- without depending on vocabulary_items
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}'::jsonb;
-- extended_data structure:
-- {
--   "examples": [{ "sentence": "...", "translationVi": "..." }],
--   "synonyms": ["..."],
--   "antonyms": ["..."],
--   "word_family": ["..."],
--   "grammar_pattern": "...",
--   "collocations": ["..."]
-- }

-- 3. Enhance fsrs_review_logs with additional analysis tracking
ALTER TABLE public.fsrs_review_logs
ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
