"use client";

import { useState } from "react";
import { Loader2, CreditCard, Lock, CheckCircle2, Zap } from "lucide-react";
import { upgradePlanAction } from "@/app/actions/subscription";

interface CheckoutModalProps {
  plan: any; // Using any for simplicity here to accept the plan object from db
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ plan, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !plan) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      // Simulate network request for payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call our server action to upgrade the plan
      const result = await upgradePlanAction(plan.name);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Có lỗi xảy ra khi nâng cấp.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-gray-200 dark:border-neutral-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 relative">
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thanh toán an toàn</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Được mã hóa 256-bit SSL
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Gói đăng ký</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 capitalize">{plan.name} Plan</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan.price_usd.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">/ tháng</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-neutral-900 p-4 rounded-xl border border-blue-100 dark:border-neutral-800 mb-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Đặc quyền ngay lập tức
            </h4>
            <ul className="text-sm text-gray-600 dark:text-neutral-300 space-y-1.5">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Nâng cấp tài khoản tự động</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Kích hoạt giới hạn hạn mức mới</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 dark:bg-red-950/30 dark:border-red-900">
              {error}
            </div>
          )}

          <form onSubmit={handleCheckout}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Phương thức thanh toán mô phỏng</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value="Thẻ ngân hàng mặc định (MOCK)"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 sm:text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-neutral-500">
                  Đây là giao diện thanh toán mô phỏng (Mock). Nhấn Thanh toán để giả lập nâng cấp thành công.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Thanh toán ${plan.price_usd.toLocaleString('vi-VN')}đ`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
