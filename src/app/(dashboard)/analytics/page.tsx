import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch total vocabulary items for user
  const { count: vocabCount } = await supabase
    .from("vocabulary_items")
    .select("*", { count: "exact", head: true });

  return <AnalyticsClient vocabCount={vocabCount || 0} />;
}
