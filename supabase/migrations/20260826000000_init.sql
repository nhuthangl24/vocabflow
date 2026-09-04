-- Supabase initial schema for VocabFlow

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    monthly_transcription_minutes INT NOT NULL,
    monthly_video_count INT NOT NULL,
    max_vocabulary_per_video INT NOT NULL,
    max_decks INT NOT NULL,
    max_upload_bytes BIGINT NOT NULL,
    retention_days INT NOT NULL,
    can_export_csv BOOLEAN DEFAULT FALSE,
    can_export_anki BOOLEAN DEFAULT FALSE,
    can_share_deck BOOLEAN DEFAULT FALSE,
    allowed_models TEXT[] DEFAULT '{}',
    price_usd NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, monthly_transcription_minutes, monthly_video_count, max_vocabulary_per_video, max_decks, max_upload_bytes, retention_days, can_export_csv, can_export_anki, can_share_deck)
VALUES 
('FREE', 30, 3, 20, 5, 104857600, 7, FALSE, FALSE, FALSE),
('BASIC', 300, 30, 50, 9999, 524288000, 90, TRUE, TRUE, FALSE),
('PRO', 1200, 100, 100, 9999, 2147483648, 365, TRUE, TRUE, TRUE);

-- 2. subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Trigger to create a FREE subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id)
  VALUES (
      NEW.id, 
      (SELECT id FROM plans WHERE name = 'FREE' LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. provider_settings (Admin only config)
CREATE TABLE provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. media_assets
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- video, audio, subtitle, youtube
    source_url TEXT,
    storage_path TEXT,
    status TEXT DEFAULT 'pending', -- pending, uploaded, processing, ready, failed
    duration_seconds INT DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. transcript_jobs
CREATE TABLE transcript_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'queued', -- queued, extracting_audio, transcribing, analyzing, completed, failed
    error_message TEXT,
    settings JSONB DEFAULT '{}', -- stores user preferences like language, level, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. transcript_segments
CREATE TABLE transcript_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES transcript_jobs(id) ON DELETE CASCADE,
    start_time_ms INT NOT NULL,
    end_time_ms INT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. vocabulary_items
CREATE TABLE vocabulary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES transcript_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    lemma TEXT,
    pronunciation TEXT,
    part_of_speech TEXT,
    level TEXT,
    meaning_vi TEXT,
    context_meaning_vi TEXT,
    original_sentence TEXT,
    sentence_translation_vi TEXT,
    start_time_ms INT,
    end_time_ms INT,
    usage_note_vi TEXT,
    examples JSONB DEFAULT '[]', -- array of { sentence, translationVi }
    collocations TEXT[] DEFAULT '{}',
    synonyms TEXT[] DEFAULT '{}',
    antonyms TEXT[] DEFAULT '{}',
    word_family TEXT[] DEFAULT '{}',
    related_words TEXT[] DEFAULT '{}',
    common_mistakes_vi TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    confidence NUMERIC(3, 2),
    simplified TEXT,
    traditional TEXT,
    pinyin TEXT,
    measure_words TEXT[] DEFAULT '{}',
    hsk_level INT,
    grammar_pattern TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. decks
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. deck_cards
CREATE TABLE deck_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    vocabulary_item_id UUID NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- SRS (SuperMemo-2 / FSRS simplified fields)
    due_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stability NUMERIC(10,4) DEFAULT 0,
    difficulty NUMERIC(10,4) DEFAULT 0,
    interval_days INT DEFAULT 0,
    repetitions INT DEFAULT 0,
    lapses INT DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (deck_id, vocabulary_item_id)
);

-- 10. study_logs
CREATE TABLE study_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES deck_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating TEXT NOT NULL, -- again, hard, good, easy
    review_time_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. usage_ledger
CREATE TABLE usage_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- transcription_seconds, llm_input_tokens, video_uploaded
    quantity NUMERIC(15,4) NOT NULL,
    unit TEXT NOT NULL, -- seconds, tokens, count
    resource_id UUID, -- reference to job or asset
    idempotency_key TEXT UNIQUE,
    provider TEXT,
    model TEXT,
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)

-- Enable RLS for all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;

-- Plans are readable by all
CREATE POLICY "Plans are public" ON plans FOR SELECT USING (true);

-- Users can only read their own subscription
CREATE POLICY "Users can read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Media assets: users can CRUD their own
CREATE POLICY "Users can CRUD own media" ON media_assets FOR ALL USING (auth.uid() = user_id);

-- Transcript jobs: users can CRUD their own
CREATE POLICY "Users can CRUD own jobs" ON transcript_jobs FOR ALL USING (auth.uid() = user_id);

-- Transcript segments: read if owns the job (using subquery for simplicity, or we can add user_id to segment)
CREATE POLICY "Users can read own segments" ON transcript_segments FOR SELECT USING (
    job_id IN (SELECT id FROM transcript_jobs WHERE user_id = auth.uid())
);

-- Vocabulary items: users can CRUD their own
CREATE POLICY "Users can CRUD own vocabulary" ON vocabulary_items FOR ALL USING (auth.uid() = user_id);

-- Decks: users can CRUD their own, everyone can read public decks
CREATE POLICY "Users can CRUD own decks" ON decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public decks are visible to all" ON decks FOR SELECT USING (is_public = true);

-- Deck cards: users can CRUD their own cards
CREATE POLICY "Users can CRUD own deck cards" ON deck_cards FOR ALL USING (auth.uid() = user_id);

-- Study logs: users can CRUD their own
CREATE POLICY "Users can CRUD own study logs" ON study_logs FOR ALL USING (auth.uid() = user_id);

-- Usage ledger: users can read their own
CREATE POLICY "Users can read own usage" ON usage_ledger FOR SELECT USING (auth.uid() = user_id);

-- Storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload their own media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can read their own media" ON storage.objects FOR SELECT USING (
    bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own media" ON storage.objects FOR DELETE USING (
    bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Admin operations on provider_settings and usage_ledger mutations should bypass RLS using a service role key in the backend.
