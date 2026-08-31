import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { deckId, cards } = body;

    if (!deckId || !cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { getUserPlanFeatures } = await import("@/lib/plans");
    const planFeatures = await getUserPlanFeatures(user);
    const maxFlashcards = planFeatures.max_flashcards;

    if (maxFlashcards !== 999999) {
      const { count } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
        
      if ((count || 0) + cards.length > maxFlashcards) {
        return NextResponse.json({ 
          error: `Gói cước hiện tại chỉ cho phép tối đa ${maxFlashcards} từ vựng. Bạn đang có ${count} từ, muốn thêm ${cards.length} từ. Hãy nâng cấp gói cước!` 
        }, { status: 403 });
      }
    }

    // Insert into flashcards
    const insertPayload = cards.map((c: any) => ({
      user_id: user.id,
      deck_id: deckId,
      term: c.term,
      pronunciation: c.pronunciation || null,
      meaning: c.meaning,
      part_of_speech: c.part_of_speech || null,
      context_sentence: c.example || null,
      state: 0, // 0 = New card in FSRS
      fsrs_difficulty: 0, // Will be initialized on first review
      stability: 0,
      reps: 0,
      lapses: 0,
      next_review_at: new Date().toISOString()
    }));

    const { error } = await supabase.from("flashcards").insert(insertPayload);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Bulk Add Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
