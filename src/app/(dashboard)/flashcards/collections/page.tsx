import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CollectionsClient from "./CollectionsClient";
import { BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Flashcard Collections | Lumina",
};

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch collections
  const { data: collections, error } = await supabase
    .from("flashcard_decks")
    .select("*, flashcards(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto mb-safe min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            Bộ sưu tập thẻ (Collections)
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
            Quản lý từ vựng phân loại theo từng chủ đề và ngôn ngữ.
          </p>
        </div>
      </div>

      <CollectionsClient initialCollections={collections || []} />
    </div>
  );
}
