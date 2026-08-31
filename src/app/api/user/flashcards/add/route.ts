import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vocabId, deckId } = body;

    if (!vocabId) {
      return NextResponse.json({ error: "vocabId is required" }, { status: 400 });
    }

    const { getUserPlanFeatures } = await import("@/lib/plans");
    const planFeatures = await getUserPlanFeatures(user);
    const maxFlashcards = planFeatures.max_flashcards;

    if (maxFlashcards !== 999999) {
      const { count } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
        
      if ((count || 0) >= maxFlashcards) {
        return NextResponse.json({ 
          error: `Gói cước hiện tại chỉ cho phép tối đa ${maxFlashcards} từ vựng. Bạn đang có ${count} từ. Hãy nâng cấp gói cước!` 
        }, { status: 403 });
      }
    }

    // 1. Get Vocabulary Item
    const { data: vocab, error: vocabError } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('id', vocabId)
      .eq('user_id', user.id)
      .single();

    if (vocabError || !vocab) {
      return NextResponse.json({ error: "Vocabulary item not found" }, { status: 404 });
    }

    // 2. Get Deck ID (or Default Deck)
    let targetDeckId = deckId;
    if (!targetDeckId) {
      const { data: defaultDeck, error: deckError } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'All Flashcards')
        .limit(1)
        .single();
      
      if (defaultDeck) {
        targetDeckId = defaultDeck.id;
      } else {
        // Create default deck if somehow missing
        const { data: newDeck, error: newDeckError } = await supabase
          .from('flashcard_decks')
          .insert({ user_id: user.id, name: 'All Flashcards', description: 'Mặc định' })
          .select('id')
          .single();
        if (!newDeckError && newDeck) targetDeckId = newDeck.id;
      }
    }

    // 3. Insert into Flashcards
    const { data: flashcard, error: insertError } = await supabase
      .from('flashcards')
      .insert({
        user_id: user.id,
        term: vocab.term,
        meaning: vocab.meaning_vi,
        pronunciation: vocab.pronunciation,
        part_of_speech: vocab.part_of_speech,
        context_sentence: vocab.original_sentence,
        deck_id: targetDeckId,
        difficulty: vocab.level,
        notes: vocab.usage_note_vi,
        state: 0,
        fsrs_difficulty: 0,
        stability: 0,
        reps: 0,
        lapses: 0,
        next_review_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation if you have one
        return NextResponse.json({ error: "Card already exists in flashcards" }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true, flashcard });
  } catch (error: any) {
    console.error("Add flashcard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
