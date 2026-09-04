CREATE TABLE IF NOT EXISTS shadowing_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES transcript_segments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, segment_id)
);

-- RLS
ALTER TABLE shadowing_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own shadowing progress"
    ON shadowing_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own shadowing progress"
    ON shadowing_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own shadowing progress"
    ON shadowing_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shadowing progress"
    ON shadowing_progress FOR DELETE
    USING (auth.uid() = user_id);
