-- Add words JSONB column to transcript_segments table to support word-level highlighting in shadowing mode
ALTER TABLE transcript_segments ADD COLUMN IF NOT EXISTS words JSONB;
