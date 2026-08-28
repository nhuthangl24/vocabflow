import { Check, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPro = user?.user_metadata?.plan === 'pro';

  const { data: plans } = await supabase.from('plans').select('*').order('price_usd');
  return (
    <div className="py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Bảng giá</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Nâng cấp <span className="text-blue-600">Lumina Vocabulary PRO</span>
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-neutral-300">
            Mở khóa sức mạnh AI không giới hạn để khai thác tối đa mọi video YouTube của bạn.
          </p>
        </div>

        <div className="isolate mx-auto mt-6 grid max-w-md grid-cols-1 gap-y-6 sm:mt-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3 lg:gap-x-6 xl:gap-x-8">

          {(plans || []).map((plan) => {
            const isCurrentPlan = (isPro && plan.price_usd > 0) || (!isPro && plan.price_usd === 0); // Simplified check, actual logic might depend on user subscription
            const features = plan.features_list 
              ? plan.features_list.split('\n').filter((f: string) => f.trim().length > 0)
              : [
                  plan.daily_video_limit === 0 ? "Không giới hạn số video xử lý" : `Tối đa ${plan.daily_video_limit} video / ngày`,
                  plan.max_video_duration_minutes === 0 ? "Không giới hạn độ dài video" : `Video dài tối đa ${plan.max_video_duration_minutes} phút`,
                  plan.enable_shadowing ? "Bật tính năng Phòng luyện Shadowing" : "Không có Phòng luyện Shadowing"
                ];

            return (
              <div key={plan.id} className={`rounded-3xl p-6 ${plan.is_recommended ? 'ring-2 ring-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-[#0a0a0a] shadow-xl relative' : 'ring-1 ring-gray-200 bg-white dark:bg-[#0a0a0a] dark:ring-neutral-800'}`}>
                {plan.is_recommended && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="bg-amber-400 text-yellow-950 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Khuyên Dùng
                    </span>
                  </div>
                )}
                <h3 className={`text-base font-semibold leading-7 ${plan.is_recommended ? 'text-yellow-900 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm leading-5 text-gray-600 dark:text-neutral-400 min-h-[40px]">{plan.description}</p>
                <p className="mt-4 flex items-baseline gap-x-1">
                  <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{plan.price_usd.toLocaleString('vi-VN')}đ</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-neutral-400">/tháng</span>
                </p>
                {isCurrentPlan ? (
                  <button disabled className={`mt-4 block w-full rounded-md py-1.5 px-3 text-center text-sm font-semibold leading-6 shadow-sm opacity-80 cursor-not-allowed ${plan.is_recommended ? 'text-yellow-950 bg-amber-400' : 'text-gray-600 ring-1 ring-inset ring-gray-200 bg-gray-50 dark:bg-neutral-900 dark:text-neutral-400'}`}>
                    Đang sử dụng Gói này
                  </button>
                ) : (
                  <button className="mt-4 block w-full rounded-md py-1.5 px-3 text-center text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors">
                    {plan.price_usd > 0 ? 'Nâng cấp ngay' : 'Sử dụng'}
                  </button>
                )}
                <ul role="list" className={`mt-6 space-y-3 text-sm leading-6 ${plan.is_recommended ? 'text-gray-700 dark:text-neutral-300' : 'text-gray-600 dark:text-neutral-300'}`}>
                  {features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex gap-x-3">
                      <Check className={`h-6 w-5 flex-none ${plan.is_recommended ? 'text-amber-500' : 'text-blue-600'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
