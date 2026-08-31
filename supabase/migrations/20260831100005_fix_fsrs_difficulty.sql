-- ===================================================================
-- Migration: 20260831100005_fix_fsrs_difficulty.sql
-- Add fsrs_difficulty to flashcards to separate algorithmic difficulty from user-facing tag 'difficulty' (like HSK 3)
-- ===================================================================

ALTER TABLE public.flashcards
ADD COLUMN fsrs_difficulty double precision DEFAULT 0;
