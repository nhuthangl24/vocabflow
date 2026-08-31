-- Final Evolution Audit: Spaced Repetition System (SRS)
-- Creates foundational tables for Flashcards and Review History using the SuperMemo-2 / Leitner algorithm concepts.

CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    term TEXT NOT NULL,
    meaning TEXT NOT NULL,
    pronunciation TEXT,
    part_of_speech TEXT,
    context_sentence TEXT,
    -- SRS Tracking fields
    easiness_factor REAL DEFAULT 2.5, -- Factor for SM-2 algorithm
    interval_days INT DEFAULT 0, -- Days until next review
    repetitions INT DEFAULT 0, -- Number of consecutive correct reviews
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_term UNIQUE (user_id, term)
);

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quality INT NOT NULL CHECK (quality >= 0 AND quality <= 5), -- 0=Blackout, 5=Perfect
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_review 
ON public.flashcards(user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_flashcards_media 
ON public.flashcards(media_asset_id);

-- Add RLS Policies
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flashcards" 
ON public.flashcards FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own flashcard reviews" 
ON public.flashcard_reviews FOR ALL USING (auth.uid() = user_id);
