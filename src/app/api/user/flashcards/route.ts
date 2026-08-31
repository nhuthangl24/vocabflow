import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deck_id');

    let query = supabase
      .from('flashcards')
      .select('*, flashcard_decks(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (deckId) {
      query = query.eq('deck_id', deckId);
    }

    const { data: cards, error: cardsError } = await query.limit(500);

    if (cardsError) throw cardsError;

    return NextResponse.json({ success: true, cards });
  } catch (error: any) {
    console.error("Cards GET API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
