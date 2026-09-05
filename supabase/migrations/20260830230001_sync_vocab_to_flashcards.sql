-- ==============================================================================
-- Migration: Sync Vocabulary to Flashcards
-- Description: Automatically creates a flashcard when a vocabulary item is added
-- ==============================================================================

-- 1. Create a function to handle the insert
CREATE OR REPLACE FUNCTION public.sync_vocab_to_flashcard()
RETURNS TRIGGER AS $$
DECLARE
    default_deck_id UUID;
BEGIN
    -- Only sync if it's a vocabulary item (grammar_pattern is null)
    IF NEW.grammar_pattern IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Find the 'All Flashcards' deck for this user, or create it if it doesn't exist
    SELECT id INTO default_deck_id FROM public.flashcard_decks 
    WHERE user_id = NEW.user_id AND name = 'All Flashcards'
    LIMIT 1;

    IF default_deck_id IS NULL THEN
        INSERT INTO public.flashcard_decks (user_id, name, description)
        VALUES (NEW.user_id, 'All Flashcards', 'Mặc định')
        RETURNING id INTO default_deck_id;
    END IF;

    -- Insert into flashcards
    INSERT INTO public.flashcards (
        user_id,
        term,
        meaning,
        pronunciation,
        part_of_speech,
        context_sentence,
        deck_id,
        difficulty,
        notes
    ) VALUES (
        NEW.user_id,
        NEW.term,
        NEW.meaning_vi,
        NEW.pronunciation,
        NEW.part_of_speech,
        NEW.original_sentence,
        default_deck_id,
        NEW.level,
        NEW.usage_note_vi
    )
    ON CONFLICT DO NOTHING; -- In case we add a unique constraint later

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_vocabulary_item_created ON public.vocabulary_items;
CREATE TRIGGER on_vocabulary_item_created
    AFTER INSERT ON public.vocabulary_items
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_vocab_to_flashcard();

-- ==============================================================================
-- Backfill Existing Data
-- ==============================================================================
DO $$
DECLARE
    vocab_record RECORD;
    default_deck_id UUID;
BEGIN
    FOR vocab_record IN 
        SELECT * FROM public.vocabulary_items WHERE grammar_pattern IS NULL
    LOOP
        -- Find or create default deck
        SELECT id INTO default_deck_id FROM public.flashcard_decks 
        WHERE user_id = vocab_record.user_id AND name = 'All Flashcards'
        LIMIT 1;

        IF default_deck_id IS NULL THEN
            INSERT INTO public.flashcard_decks (user_id, name, description)
            VALUES (vocab_record.user_id, 'All Flashcards', 'Mặc định')
            RETURNING id INTO default_deck_id;
        END IF;

        -- Check if it already exists to avoid duplicates during backfill
        IF NOT EXISTS (
            SELECT 1 FROM public.flashcards 
            WHERE user_id = vocab_record.user_id AND term = vocab_record.term
        ) THEN
            INSERT INTO public.flashcards (
                user_id,
                term,
                meaning,
                pronunciation,
                part_of_speech,
                context_sentence,
                deck_id,
                difficulty,
                notes
            ) VALUES (
                vocab_record.user_id,
                vocab_record.term,
                vocab_record.meaning_vi,
                vocab_record.pronunciation,
                vocab_record.part_of_speech,
                vocab_record.original_sentence,
                default_deck_id,
                vocab_record.level,
                vocab_record.usage_note_vi
            );
        END IF;
    END LOOP;
END;
$$;
