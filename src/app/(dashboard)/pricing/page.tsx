import { createClient } from "@/lib/supabase/server";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userPlan = (user?.user_metadata?.plan || 'free').toLowerCase();

  const { data: plans } = await supabase.from('plans').select('*').order('price_usd');
  
  return (
    <div className="py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Bảng giá</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Nâng cấp <span className="text-blue-600">Lumina Vocabulary</span>
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-neutral-300">
            Mở khóa sức mạnh AI không giới hạn để khai thác tối đa mọi video YouTube của bạn.
          </p>
        </div>

        <PricingClient plans={plans || []} userPlan={userPlan} />
      </div>
    </div>
  );
}
