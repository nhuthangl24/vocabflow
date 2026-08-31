import { createAdminClient } from "@/lib/supabase/admin";
import { GrammarAdminClient } from "./GrammarAdminClient";

export const revalidate = 0;
export const metadata = { title: "Ngữ Pháp – Lumina Admin" };

export default async function AdminGrammarPage() {
  const adminClient = createAdminClient();

  const [{ data: grammarItems }, { count: totalItems }] = await Promise.all([
    adminClient
      .from("grammar_items")
      .select("id, structure, user_id, level, explanation_vi, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    adminClient.from("grammar_items").select("*", { count: "exact", head: true }),
  ]);

  return <GrammarAdminClient items={grammarItems ?? []} totalCount={totalItems ?? 0} />;
}
