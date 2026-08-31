"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { CheckoutModal } from "@/components/pricing/CheckoutModal";

export default function PricingClient({ plans, userPlan }: { plans: any[], userPlan: string }) {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  const handleCheckoutSuccess = () => {
    setSelectedPlan(null);
    // Page will be automatically refreshed by revalidatePath in the server action,
    // but we can also window.location.reload() or just let Next.js do its thing.
  };

  return (
    <>
      <div className="isolate mx-auto mt-6 grid max-w-md grid-cols-1 gap-y-6 sm:mt-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3 lg:gap-x-6 xl:gap-x-8">
        {(plans || []).map((plan) => {
          const currentPlanData = plans.find(p => p.name.toLowerCase() === userPlan);
          const currentPrice = currentPlanData?.price_usd || 0;
          const isCurrentPlan = userPlan === plan.name.toLowerCase();
          const isDowngrade = plan.price_usd < currentPrice;
          const isDisabled = plan.is_active === false;
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
                <button disabled className={`mt-6 block w-full rounded-xl py-3 px-3 text-center text-sm font-bold shadow-sm cursor-not-allowed ${plan.is_recommended ? 'text-yellow-900 bg-amber-200/50 border border-amber-300 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-500' : 'text-gray-500 border border-gray-200 bg-gray-50 dark:bg-neutral-900/50 dark:border-neutral-800 dark:text-neutral-500'}`}>
                  Đang sử dụng Gói này
                </button>
              ) : isDisabled ? (
                <button disabled className="mt-6 block w-full rounded-xl py-3 px-3 text-center text-sm font-bold shadow-sm opacity-50 cursor-not-allowed text-gray-400 bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-600">
                  Tạm ngừng đăng ký
                </button>
              ) : isDowngrade ? (
                <button disabled className="mt-6 block w-full rounded-xl py-3 px-3 text-center text-sm font-bold shadow-sm opacity-50 cursor-not-allowed text-gray-400 bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-600">
                  Không khả dụng (Gói thấp hơn)
                </button>
              ) : (
                <button 
                  onClick={() => setSelectedPlan(plan)}
                  className={`mt-6 block w-full rounded-xl py-3 px-3 text-center text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.is_recommended ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-yellow-950 shadow-amber-500/20 hover:from-amber-300 hover:to-amber-200' : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
                >
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

      <CheckoutModal 
        isOpen={!!selectedPlan} 
        plan={selectedPlan} 
        onClose={() => setSelectedPlan(null)} 
        onSuccess={handleCheckoutSuccess} 
      />
    </>
  );
}
