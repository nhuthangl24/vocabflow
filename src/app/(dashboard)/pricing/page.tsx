import { Check, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPro = user?.user_metadata?.plan === 'pro';

  const { data: plans } = await supabase.from('plans').select('*').order('price_usd');
  const freePlan = plans?.find(p => p.price_usd === 0) || {
    name: "Gói Cơ Bản (Free)",
    description: "Trải nghiệm tính năng trích xuất từ vựng cơ bản.",
    price_usd: 0,
    monthly_transcription_minutes: 25,
    max_vocabulary_per_video: 35,
    monthly_video_count: 2
  };
  
  const proPlan = plans?.find(p => p.price_usd > 0) || {
    name: "Gói PRO",
    description: "Dành cho người học ngoại ngữ nghiêm túc và chuyên nghiệp.",
    price_usd: 69000,
    monthly_transcription_minutes: 999999,
    max_vocabulary_per_video: 50,
    monthly_video_count: 15
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Bảng giá</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Nâng cấp <span className="text-blue-600">Lumina Vocabulary PRO</span>
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-neutral-300">
            Mở khóa sức mạnh AI không giới hạn để khai thác tối đa mọi video YouTube của bạn.
          </p>
        </div>

        <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-y-8 sm:mt-12 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          
          {/* Free Tier */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200 bg-white dark:bg-[#0a0a0a] dark:ring-neutral-800">
            <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-white">{freePlan.name}</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-neutral-400">{freePlan.description}</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{freePlan.price_usd.toLocaleString('vi-VN')}đ</span>
              <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-neutral-400">/tháng</span>
            </p>
            {isPro ? (
              <Link href="/dashboard" className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 dark:ring-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 transition-colors">
                Hạ cấp (Liên hệ)
              </Link>
            ) : (
              <Link href="/dashboard" className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 dark:ring-neutral-700 dark:text-white dark:hover:bg-neutral-800 transition-colors">
                Đang sử dụng
              </Link>
            )}
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-neutral-300">
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> {freePlan.monthly_transcription_minutes > 100000 ? "Không giới hạn" : `Tối đa ${freePlan.monthly_transcription_minutes} phút / video`}</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> {freePlan.max_vocabulary_per_video} từ vựng cốt lõi mỗi video</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Tối đa {freePlan.monthly_video_count} video / tháng</li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="rounded-3xl p-8 ring-2 ring-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-[#0a0a0a] shadow-xl relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-amber-400 text-yellow-950 text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full flex items-center gap-1 shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Khuyên Dùng
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-8 text-yellow-900 dark:text-amber-400">{proPlan.name}</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-neutral-400">{proPlan.description}</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{proPlan.price_usd.toLocaleString('vi-VN')}đ</span>
              <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-neutral-400">/tháng</span>
            </p>
            {isPro ? (
              <button disabled className="mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-yellow-950 bg-amber-400 shadow-sm opacity-80 cursor-not-allowed">
                Đang sử dụng Gói PRO
              </button>
            ) : (
              <button className="mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shadow-sm transition-colors">
                Nâng cấp ngay
              </button>
            )}
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-700 dark:text-neutral-300">
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> <strong>{proPlan.monthly_transcription_minutes > 100000 ? "Không giới hạn độ dài video" : `Tối đa ${proPlan.monthly_transcription_minutes} phút/video`}</strong></li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> Trích xuất siêu sâu <strong>{proPlan.max_vocabulary_per_video}+ từ vựng/thành ngữ</strong></li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> Tối đa {proPlan.monthly_video_count} video / tháng</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
