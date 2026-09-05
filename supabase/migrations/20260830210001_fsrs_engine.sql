-- Migration: FSRS Engine for Flashcards
-- Upgrades the basic SM-2 flashcard table to support the advanced FSRS (Free Spaced Repetition Scheduler) algorithm.

-- Step 1: Add FSRS fields to flashcards
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS state INT DEFAULT 0 CHECK (state >= 0 AND state <= 3), -- 0=New, 1=Learning, 2=Review, 3=Relearning
ADD COLUMN IF NOT EXISTS difficulty REAL DEFAULT 0, -- D
ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 0, -- S
ADD COLUMN IF NOT EXISTS reps INT DEFAULT 0, -- Total repetitions
ADD COLUMN IF NOT EXISTS lapses INT DEFAULT 0, -- Times forgotten
ADD COLUMN IF NOT EXISTS elapsed_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days INT DEFAULT 0;

-- Map old SM-2 `next_review_at` semantics to FSRS if needed, but we already have next_review_at.
-- Let's ensure next_review_at is indexed properly for FSRS queuing.
CREATE INDEX IF NOT EXISTS idx_flashcards_queue 
ON public.flashcards(user_id, state, next_review_at);

-- Step 2: Create a detailed Review Log table for FSRS analytics (replaces simple flashcard_reviews if needed, or expands it)
CREATE TABLE IF NOT EXISTS public.fsrs_review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 4), -- 1: Again, 2: Hard, 3: Good, 4: Easy
    state INT NOT NULL, -- State before review
    due TIMESTAMPTZ, -- Due date before review
    stability REAL NOT NULL, -- Stability before review
    difficulty REAL NOT NULL, -- Difficulty before review
    elapsed_days INT NOT NULL, 
    scheduled_days INT NOT NULL,
    review_duration_ms INT DEFAULT 0, -- How long it took the user to answer
    
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_fsrs_logs_user 
ON public.fsrs_review_logs(user_id, reviewed_at);

CREATE INDEX IF NOT EXISTS idx_fsrs_logs_card 
ON public.fsrs_review_logs(flashcard_id);

-- RLS
ALTER TABLE public.fsrs_review_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fsrs logs" 
ON public.fsrs_review_logs FOR ALL USING (auth.uid() = user_id);
