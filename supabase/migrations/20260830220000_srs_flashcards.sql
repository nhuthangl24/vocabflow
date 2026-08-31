-- ==============================================================================
-- Migration: Enhanced SRS & Flashcards (Phase 2.1)
-- Description: Add decks, folders, and advanced flashcard metadata
-- ==============================================================================

-- 1. Create Flashcard Decks Table
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    folder TEXT, -- optional folder grouping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS flashcard_decks_user_id_idx ON public.flashcard_decks(user_id);

-- Enable RLS
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own decks"
    ON public.flashcard_decks
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. Modify Flashcards Table
-- Add foreign key to decks, difficulty (A1-C2, Easy-Hard), tags, favorite, notes
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS difficulty TEXT, -- 'A1', 'B2', or 'easy', 'hard'
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- We already have easiness_factor, interval_days, repetitions, next_review_at
-- If they don't have defaults, let's set them
ALTER TABLE public.flashcards 
ALTER COLUMN easiness_factor SET DEFAULT 2.5,
ALTER COLUMN interval_days SET DEFAULT 0,
ALTER COLUMN repetitions SET DEFAULT 0;

-- Create default deck for existing cards if needed (we'll handle logic in application layer)
