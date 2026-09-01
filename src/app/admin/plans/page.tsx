import { createAdminClient } from "@/lib/supabase/admin";
import PlansClient from "./PlansClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plans – Lumina Admin" };

export default async function AdminPlansPage() {
  const admin = createAdminClient();

  const [{ data: plans }, { data: subCounts }] = await Promise.all([
    admin.from("plans").select("*, plan_features(feature_key, is_enabled), plan_limits(limit_key, limit_value)").order("sort_order").order("price_usd"),
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

  const plansWithCounts = (plans || []).map(p => {
    const flatPlan = { ...p, subscriber_count: subscriberMap[p.id] || 0 };
    
    if (p.plan_features) {
      for (const f of p.plan_features) flatPlan[f.feature_key] = f.is_enabled;
    }
    if (p.plan_limits) {
      for (const l of p.plan_limits) flatPlan[l.limit_key] = Number(l.limit_value);
    }
    
    delete flatPlan.plan_features;
    delete flatPlan.plan_limits;
    return flatPlan;
  });

  return <PlansClient plans={plansWithCounts} />;
}
