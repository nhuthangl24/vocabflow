import { createPlan } from "../actions";
import PlanForm from "../PlanForm";

export const metadata = { title: "Tạo Plan mới – Admin" };

export default function NewPlanPage() {
  return <PlanForm action={createPlan} mode="create" />;
}
