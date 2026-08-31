import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudyClient from "./StudyClient";
import { BrainCircuit, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Study Flashcards | Lumina",
};

export default async function StudyDeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { deckId } = await params;
  
  // Fetch due cards for this deck
  const now = new Date().toISOString();
  
  let query = supabase
    .from("flashcards")
    .select("*, flashcard_decks(name)")
    .eq("user_id", user.id)
    .or(`state.eq.0,next_review_at.lte.${now}`)
    .order("next_review_at", { ascending: true });
    
  const flashcardLimit = user.user_metadata?.flashcard_limit ? parseInt(user.user_metadata.flashcard_limit, 10) : 50;
  if (flashcardLimit > 0) {
    query = query.limit(flashcardLimit);
  }

  if (deckId !== 'all') {
    query = query.eq("deck_id", deckId);
  }

  const { data: cards, error } = await query;

  if (cards && cards.length > 0) {
    const terms = cards.map(c => c.term);
    const { data: vocabItems } = await supabase
      .from("vocabulary_items")
      .select("*")
      .eq("user_id", user.id)
      .in("term", terms);

    if (vocabItems) {
      cards.forEach(card => {
        card.vocabData = vocabItems.find(v => v.term.toLowerCase() === card.term.toLowerCase());
      });
    }
  }

  const totalDue = cards?.length || 0;

  // Deck Name
  let deckName = "All Flashcards";
  if (deckId !== 'all' && cards && cards.length > 0 && cards[0].flashcard_decks) {
    deckName = cards[0].flashcard_decks.name;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/flashcards" className="p-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            Đang học: {deckName}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-500 dark:text-neutral-400">Hàng đợi</div>
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalDue}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {cards && cards.length > 0 ? (
          <StudyClient initialCards={cards} deckId={deckId} />
        ) : (
          <div className="text-center py-24 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex-1 flex flex-col items-center justify-center">
            <BrainCircuit className="w-16 h-16 text-slate-300 dark:text-neutral-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Tuyệt vời!</h2>
            <p className="text-slate-500 dark:text-neutral-400 mb-6">
              Bạn đã hoàn thành tất cả các thẻ cần ôn tập trong bộ này.
            </p>
            <a href="/flashcards" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors">
              Trở về Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
