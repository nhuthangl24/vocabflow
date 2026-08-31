import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIUsageClient from "./AIUsageClient";

export const metadata = {
  title: "AI Usage Tracker | Lumina",
};

export default async function UserAIUsagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch plan info
  const userPlanName = (user?.user_metadata?.plan || 'free').toUpperCase();
  const { data: planData } = await supabase.from('plans').select('ai_credits').ilike('name', userPlanName).single();
  const creditsLimit = planData?.ai_credits || 0; // 0 usually means unlimited in some logic, but let's assume it's the limit

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto mb-safe min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Usage Tracker</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
          Kiểm soát chi tiết lượng tài nguyên AI bạn đã sử dụng.
        </p>
      </div>

      <AIUsageClient userPlan={userPlanName} creditsLimit={creditsLimit} />
    </div>
  );
}
