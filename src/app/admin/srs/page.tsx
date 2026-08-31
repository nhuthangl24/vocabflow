import { createAdminClient } from "@/lib/supabase/admin";
import { SRSAdminClient } from "./SRSAdminClient";

export const revalidate = 0;
export const metadata = { title: "SRS & Flashcards – Lumina Admin" };

export default async function AdminSRSPage() {
  const adminClient = createAdminClient();

  const [
    { data: flashcardsRaw },
    { count: totalCards },
    { count: totalReviews },
  ] = await Promise.all([
    adminClient
      .from("flashcards")
      .select("id, term, user_id, state, stability, difficulty, next_review_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    adminClient.from("flashcards").select("*", { count: "exact", head: true }),
    adminClient.from("fsrs_review_logs").select("*", { count: "exact", head: true }),
  ]);

  return (
    <SRSAdminClient
      flashcards={flashcardsRaw ?? []}
      totalCards={totalCards ?? 0}
      totalReviews={totalReviews ?? 0}
    />
  );
}
