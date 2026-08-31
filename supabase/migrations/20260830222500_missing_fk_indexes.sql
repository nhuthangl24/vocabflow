-- ==============================================================================
-- Migration: Add Missing FK Indexes
-- Description: Optimizes database performance by indexing foreign keys
-- ==============================================================================

CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS transcript_jobs_user_id_idx ON public.transcript_jobs(user_id);
CREATE INDEX IF NOT EXISTS transcript_segments_job_id_idx ON public.transcript_segments(job_id);
CREATE INDEX IF NOT EXISTS decks_user_id_idx ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS deck_cards_user_id_idx ON public.deck_cards(user_id);
CREATE INDEX IF NOT EXISTS study_logs_card_id_idx ON public.study_logs(card_id);
CREATE INDEX IF NOT EXISTS study_logs_user_id_idx ON public.study_logs(user_id);
CREATE INDEX IF NOT EXISTS usage_ledger_user_id_idx ON public.usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS media_assets_playlist_id_idx ON public.media_assets(playlist_id);
CREATE INDEX IF NOT EXISTS flashcard_reviews_flashcard_id_idx ON public.flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS flashcard_reviews_user_id_idx ON public.flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS orders_approved_by_idx ON public.orders(approved_by);
CREATE INDEX IF NOT EXISTS order_logs_actor_id_idx ON public.order_logs(actor_id);
