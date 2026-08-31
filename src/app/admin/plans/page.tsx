import { createAdminClient } from "@/lib/supabase/admin";
import PlansClient from "./PlansClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plans – Lumina Admin" };

export default async function AdminPlansPage() {
  const admin = createAdminClient();

  const [{ data: plans }, { data: subCounts }] = await Promise.all([
    admin.from("plans").select("*").order("sort_order").order("price_usd"),
    admin
      .from("subscriptions")
      .select("plan_id")
      .eq("status", "active"),
  ]);

  // Count subscribers per plan
  const subscriberMap: Record<string, number> = {};
  for (const sub of subCounts || []) {
    if (sub.plan_id) subscriberMap[sub.plan_id] = (subscriberMap[sub.plan_id] || 0) + 1;
  }

  const plansWithCounts = (plans || []).map(p => ({
    ...p,
    subscriber_count: subscriberMap[p.id] || 0,
  }));

  return <PlansClient plans={plansWithCounts} />;
}
