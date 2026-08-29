import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VocabularyClient from "./VocabularyClient";

export default async function VocabularyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items } = await supabase
    .from("vocabulary_items")
    .select("*, transcript_jobs(settings)")
    .is("grammar_pattern", null)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 sm:p-5 w-full mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-white">Kho Từ vựng của bạn</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-300 dark:text-neutral-400">Toàn bộ từ vựng đã trích xuất từ các video (đã loại bỏ các từ trùng lặp).</p>
      </div>

      <VocabularyClient items={items || []} />
    </div>
  );
}
