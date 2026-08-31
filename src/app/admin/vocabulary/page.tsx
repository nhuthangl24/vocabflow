import { createAdminClient } from "@/lib/supabase/admin";
import VocabularyAdminClient from "./VocabularyAdminClient";

export const revalidate = 0;
export const metadata = { title: "Từ Vựng – Lumina Admin" };

export default async function AdminVocabularyPage() {
  const supabase = createAdminClient();

  const [
    { data: items, count: totalCount },
    { count: userCount },
  ] = await Promise.all([
    supabase
      .from("vocabulary_items")
      .select("id, term, lemma, pronunciation, part_of_speech, level, meaning_vi, user_id, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("vocabulary_items")
      .select("user_id", { count: "exact", head: true })
      .not("user_id", "is", null),
  ]);

  // Unique terms and level breakdown
  const termSet = new Set(items?.map((i) => i.term.toLowerCase()) ?? []);
  const levelBreakdown: Record<string, number> = {};
  for (const item of items ?? []) {
    if (item.level) {
      levelBreakdown[item.level] = (levelBreakdown[item.level] || 0) + 1;
    }
  }

  // Approximate unique user count by grouping user_ids
  const uniqueUsers = new Set(items?.map((i) => i.user_id) ?? []).size;

  return (
    <VocabularyAdminClient
      items={items ?? []}
      totalCount={totalCount ?? 0}
      termCount={termSet.size}
      userCount={uniqueUsers}
      levelBreakdown={levelBreakdown}
    />
  );
}
