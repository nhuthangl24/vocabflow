"use client";

import { useState, useEffect } from "react";
import { Loader2, Lock, CheckCircle2, Zap, Copy, AlertCircle, Clock, CreditCard } from "lucide-react";
import { createOrderAction, expireOrderAction } from "@/app/actions/payment";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface CheckoutModalProps {
  plan: any; 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ plan, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<'select' | 'qr' | 'expired'>('select');
  const [orderData, setOrderData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (step === 'qr' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (step === 'qr' && timeLeft === 0) {
      // Auto expire order when timer hits 0
      setStep('expired');
      if (orderData?.order?.id) {
        expireOrderAction(orderData.order.id).then(() => {
          router.refresh();
        });
      }
    }
    
    return () => clearInterval(timer);
  }, [step, timeLeft, orderData, router]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setOrderData(null);
      setTimeLeft(180);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      const result = await createOrderAction(plan.name, plan.price_usd);

      if (result.success) {
        setOrderData(result);
        setTimeLeft(180);
        setStep('qr');
      } else {
        setError(result.error || "Có lỗi xảy ra khi tạo đơn hàng.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-gray-200 dark:border-neutral-800 flex flex-col md:flex-row h-[600px] max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* LEFT COLUMN: Order Summary */}
        <div className="w-full md:w-5/12 bg-gray-50 dark:bg-neutral-900 border-r border-gray-100 dark:border-neutral-800 p-8 flex flex-col relative overflow-y-auto">
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" /> Thanh toán an toàn
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1 mb-8">
              Mã hoá bảo mật 256-bit SSL
            </p>

            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Đơn hàng của bạn</p>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{plan.name} Plan</h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">
                    {plan.price_usd.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">/ tháng</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 mb-6">
              <h4 className="text-sm font-bold text-gray-900 dark:text-emerald-100 mb-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-500" /> Đặc quyền mở khóa ngay
              </h4>
              <ul className="text-sm text-gray-600 dark:text-emerald-200/70 space-y-2">
                <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Chuyển khoản QR siêu tốc (VietQR)</li>
                <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Nâng cấp hạn mức AI tự động</li>
                <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Truy cập phòng luyện Shadowing</li>
              </ul>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 dark:bg-red-950/30 dark:border-red-900 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
          
        </div>

        {/* RIGHT COLUMN: Payment Actions / QR */}
        <div className="w-full md:w-7/12 bg-white dark:bg-[#0a0a0a] p-8 flex flex-col relative overflow-y-auto">
          
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-900 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {step === 'select' && (
            <div className="flex-1 flex flex-col justify-center items-center h-full max-w-md mx-auto text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-blue-600 dark:text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thanh toán chuyển khoản</h3>
              <p className="text-gray-500 dark:text-neutral-400 mb-8">
                Bạn sẽ được cung cấp mã VietQR để thanh toán bằng bất kỳ ứng dụng ngân hàng nào tại Việt Nam.
              </p>
              
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:hover:scale-100 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang khởi tạo mã QR...
                  </>
                ) : (
                  `Tạo mã QR Thanh toán`
                )}
              </button>
            </div>
          )}

          {step === 'qr' && orderData && (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full animate-in slide-in-from-right duration-500">
              
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quét mã để thanh toán</h3>
                
                {/* Timer Badge */}
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
                Sử dụng App Ngân hàng hoặc Momo quét mã QR bên dưới. Nội dung chuyển khoản đã được điền tự động.
              </p>

              <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/5 border border-gray-100 mx-auto w-full max-w-[240px] mb-8 relative group">
                <img 
                  src={`https://img.vietqr.io/image/${orderData.settings.bank_code}-${orderData.settings.account_number}-compact2.png?amount=${orderData.order.amount}&addInfo=${orderData.order.transfer_content}&accountName=${encodeURIComponent(orderData.settings.account_name)}`}
                  alt="QR Code Payment" 
                  className="w-full h-auto rounded-lg"
                />
                {/* Animated scan line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_10px_2px_rgba(59,130,246,0.5)] z-10 animate-scan"></div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors group">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-neutral-500 mb-1">Số tiền (VND)</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{orderData.order.amount.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <button onClick={() => copyToClipboard(orderData.order.amount.toString())} className="text-gray-400 hover:text-blue-500 bg-white dark:bg-[#0a0a0a] p-2 rounded-lg shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors group">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-neutral-500 mb-1">Nội dung bắt buộc (Mã Đơn)</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-xl tracking-widest">{orderData.order.transfer_content}</p>
                  </div>
                  <button onClick={() => copyToClipboard(orderData.order.transfer_content)} className="text-gray-400 hover:text-blue-500 bg-white dark:bg-[#0a0a0a] p-2 rounded-lg shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success('Đã gửi yêu cầu! Vui lòng đợi Admin kiểm tra và nâng cấp nhé.', {
                    duration: 5000,
                    icon: '⏳'
                  });
                  onSuccess();
                  onClose();
                }}
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 transition-all border border-gray-200 dark:border-neutral-800"
              >
                Tôi đã thanh toán thành công
              </button>
            </div>
          )}

          {step === 'expired' && (
            <div className="flex-1 flex flex-col justify-center items-center h-full max-w-md mx-auto text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đơn hàng đã hết hạn</h3>
              <p className="text-gray-500 dark:text-neutral-400 mb-8">
                Thời gian thanh toán (3 phút) đã kết thúc. Vui lòng tạo đơn hàng mới nếu bạn vẫn muốn nâng cấp.
              </p>
              
              <button
                onClick={() => {
                  setStep('select');
                  setTimeLeft(180);
                }}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
              >
                Tạo Đơn Hàng Mới
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
