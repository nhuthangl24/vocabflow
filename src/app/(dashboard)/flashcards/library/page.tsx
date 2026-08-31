import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LibraryClient from "./LibraryClient";
import { LibraryBig } from "lucide-react";

export const metadata = {
  title: "Flashcard Library | Lumina",
};

export default async function FlashcardLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto mb-safe min-h-screen flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <LibraryBig className="w-6 h-6 text-indigo-500" />
            Thư viện Flashcards
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
            Quản lý toàn bộ thẻ từ vựng của bạn.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
        <LibraryClient />
      </div>
    </div>
  );
}
