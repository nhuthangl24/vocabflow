import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fsrsEngine, mapToFSRSCard, calculateNextReview, Rating, Grade } from "@/lib/srs/fsrs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { flashcardId, rating } = await req.json();

    if (!flashcardId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // 1. Fetch current flashcard state
    const { data: flashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !flashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // 2. Map to FSRS Card
    const card = mapToFSRSCard(flashcard);

    // 3. Calculate next review
    const now = new Date();
    const reviewLog = calculateNextReview(card, rating as Grade, now);
    const nextCard = reviewLog.card;
    const log = reviewLog.log;

    // 4. Start transaction to update flashcard and insert log
    // We update the flashcard
    const { error: updateError } = await supabase
      .from("flashcards")
      .update({
        state: nextCard.state,
        fsrs_difficulty: nextCard.difficulty,
        stability: nextCard.stability,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        elapsed_days: nextCard.elapsed_days,
        scheduled_days: nextCard.scheduled_days,
        next_review_at: nextCard.due.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", flashcardId);

    if (updateError) {
      throw updateError;
    }

    // Insert log
    const { error: logError } = await supabase
      .from("fsrs_review_logs")
      .insert({
        flashcard_id: flashcardId,
        user_id: user.id,
        rating: log.rating,
        state: log.state,
        due: log.due.toISOString(),
        stability: nextCard.stability,
        fsrs_difficulty: nextCard.difficulty,
        elapsed_days: log.elapsed_days,
        scheduled_days: log.scheduled_days,
        review_duration_ms: 0,
        reviewed_at: now.toISOString(),
      });

    if (logError) {
      console.error("Failed to insert FSRS log", logError);
      // We don't fail the request if logging fails, but we should monitor this.
    }

    return NextResponse.json({ success: true, nextCard });
  } catch (error: any) {
    console.error("FSRS Review Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
