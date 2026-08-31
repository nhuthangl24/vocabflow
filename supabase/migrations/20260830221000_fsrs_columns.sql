-- ==============================================================================
-- Migration: Add FSRS columns to flashcards table
-- Description: Convert SM-2 flashcard columns to FSRS standard columns
-- ==============================================================================

ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS state INTEGER DEFAULT 0, -- 0: New, 1: Learning, 2: Review, 3: Relearning
ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reps INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lapses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS elapsed_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days INTEGER DEFAULT 0;

-- Optionally, we can rename the SM-2 columns or just leave them. We'll leave them to avoid breaking old code that hasn't been migrated yet, but FSRS code will use the new columns.

-- Create fsrs_review_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fsrs_review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL, -- 1: Again, 2: Hard, 3: Good, 4: Easy
    state INTEGER NOT NULL,
    due TIMESTAMP WITH TIME ZONE NOT NULL,
    stability REAL NOT NULL,
    difficulty REAL NOT NULL,
    elapsed_days INTEGER NOT NULL,
    scheduled_days INTEGER NOT NULL,
    review_duration_ms INTEGER DEFAULT 0,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS fsrs_review_logs_flashcard_id_idx ON public.fsrs_review_logs(flashcard_id);
CREATE INDEX IF NOT EXISTS fsrs_review_logs_user_id_idx ON public.fsrs_review_logs(user_id);

-- Enable RLS
ALTER TABLE public.fsrs_review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own fsrs logs"
    ON public.fsrs_review_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own fsrs logs"
    ON public.fsrs_review_logs
    FOR SELECT
    USING (auth.uid() = user_id);
