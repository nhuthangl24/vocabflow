import { createClient } from "@/lib/supabase/server";
import SidebarClient from "./SidebarClient";
import { getUserPlanFeatures } from "@/lib/plans";

export default async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const planFeatures = await getUserPlanFeatures(user);

  return <SidebarClient user={user} planFeatures={planFeatures} />;
}
