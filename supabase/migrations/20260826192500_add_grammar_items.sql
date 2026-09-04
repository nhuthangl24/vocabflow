CREATE TABLE grammar_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES transcript_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grammar_pattern TEXT NOT NULL,
    level TEXT,
    meaning_vi TEXT,
    explanation_vi TEXT,
    original_sentence TEXT,
    sentence_translation_vi TEXT,
    start_time_ms INT,
    end_time_ms INT,
    examples JSONB DEFAULT '[]', -- array of { sentence, translationVi }
    confidence NUMERIC(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE grammar_items ENABLE ROW LEVEL SECURITY;

-- Policy for CRUD own items
CREATE POLICY "Users can CRUD own grammar items" ON grammar_items FOR ALL USING (auth.uid() = user_id);
