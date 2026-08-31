import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { updatePlan } from "../../actions";
import PlanForm from "../../PlanForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sửa Plan – Admin" };

export default async function EditPlanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const admin = createAdminClient();
  const { data: plan, error } = await admin.from("plans").select("*").eq("id", params.id).single();

  if (error || !plan) notFound();

  const updateWithId = updatePlan.bind(null, params.id);

  return <PlanForm plan={plan} action={updateWithId} mode="edit" />;
}
