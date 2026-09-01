import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import FlashcardsClient from "./FlashcardsClient";
import { BrainCircuit, PlayCircle } from "lucide-react";

export const metadata = {
  title: "Flashcards Dashboard | Lumina",
};

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch total cards
  const { count: totalCards } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  
  // 2. Fetch cards by FSRS state (0: New, 1: Learning, 2: Review, 3: Relearning)
  const { count: newCards } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("state", 0);
  const { count: learningCards } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("state", [1,3]);
  const { count: reviewCards } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("state", 2);

  // 3. Fetch due cards (Due Today)
  const now = new Date().toISOString();
  const { count: dueCards } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review_at", now).neq("state", 0);

  const userLimit = user.user_metadata?.flashcard_limit ? parseInt(user.user_metadata.flashcard_limit, 10) : 50;

  const stats = {
    total: totalCards || 0,
    new: newCards || 0,
    learning: learningCards || 0,
    review: reviewCards || 0,
    due: (dueCards || 0) + (newCards || 0), // due includes new cards
    userLimit,
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto mb-safe min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            Không Gian Ôn Tập (FSRS)
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
            Hệ thống lặp lại ngắt quãng thế hệ mới.
          </p>
        </div>
        {stats.due > 0 && (
          <Link
            href="/flashcards/study/all"
            className="group flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-indigo-500/20 active:scale-95 shrink-0"
          >
            <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Ôn tập ngay ({stats.due})</span>
          </Link>
        )}
      </div>

      <FlashcardsClient stats={stats} />
    </div>
  );
}
