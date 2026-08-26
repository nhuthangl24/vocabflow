import { Check, Zap } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Bảng giá</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Nâng cấp <span className="text-blue-600">Lumina Vocabulary PRO</span>
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Mở khóa sức mạnh AI không giới hạn để khai thác tối đa mọi video YouTube của bạn.
          </p>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          
          {/* Free Tier */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200 bg-white">
            <h3 className="text-lg font-semibold leading-8 text-gray-900">Gói Cơ Bản (Free)</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600">Trải nghiệm tính năng trích xuất từ vựng cơ bản.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">0đ</span>
              <span className="text-sm font-semibold leading-6 text-gray-600">/tháng</span>
            </p>
            <Link href="/dashboard" className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Đang sử dụng
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Tối đa 30 phút / video</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> 30 từ vựng cốt lõi mỗi video</li>
              <li className="flex gap-x-3 text-gray-400"><Check className="h-6 w-5 flex-none" /> <del>Không giới hạn video (chỉ 5 video/ngày)</del></li>
              <li className="flex gap-x-3 text-gray-400"><Check className="h-6 w-5 flex-none" /> <del>Hỗ trợ đa ngôn ngữ (Sắp ra mắt)</del></li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="rounded-3xl p-8 ring-2 ring-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-xl relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-amber-400 text-yellow-950 text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full flex items-center gap-1 shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Khuyên Dùng
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-8 text-yellow-900">Gói PRO</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600">Dành cho người học ngoại ngữ nghiêm túc và chuyên nghiệp.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">69.000đ</span>
              <span className="text-sm font-semibold leading-6 text-gray-600">/tháng</span>
            </p>
            <button className="mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shadow-sm transition-colors">
              Nâng cấp ngay
            </button>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> <strong>Không giới hạn độ dài video</strong></li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> Trích xuất siêu sâu <strong>50+ từ vựng/thành ngữ</strong></li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> Không giới hạn số lượng video tải lên</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> Ưu tiên tốc độ xử lý AI (Nhanh gấp 3x)</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-amber-500" /> Phân tích ngữ pháp và sắc thái biểu đạt</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
