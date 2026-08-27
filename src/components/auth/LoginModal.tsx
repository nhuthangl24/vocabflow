"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";

export default function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(true);

  // Close modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        closeModal();
        router.push("/dashboard");
        router.refresh();
      } else {
        if (password !== confirmPassword) {
          throw new Error("Mật khẩu nhập lại không khớp!");
        }
        if (!fullName.trim()) {
          throw new Error("Vui lòng nhập họ và tên của bạn!");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        setError("Vui lòng kiểm tra email để xác nhận tài khoản!");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={closeModal}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all animate-in zoom-in-95 duration-200 border border-slate-100 dark:bg-[#0a0a0a] dark:border-neutral-800">
        
        {/* Decorative Top Gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"></div>

        <button
          onClick={closeModal}
          className="absolute right-4 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none z-10 dark:text-neutral-400"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 pt-10 pb-8">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgb(79,70,229,0.3)] mx-auto mb-5 transform rotate-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isLogin ? "Chào mừng trở lại!" : "Bắt đầu học ngay"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {isLogin ? "Đăng ký tại đây" : "Đăng nhập ngay"}
              </button>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 border border-rose-100 flex items-start gap-3">
                <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-rose-200 flex items-center justify-center text-[10px] font-bold text-rose-700">!</div>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <label className="sr-only" htmlFor="fullName">Họ và tên</label>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Sparkles className="h-5 w-5 text-slate-400 dark:text-neutral-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={!isLogin}
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white text-sm sm:leading-6 font-medium transition-all shadow-sm dark:bg-[#0a0a0a] dark:text-white"
                    placeholder="Họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="relative">
                <label className="sr-only" htmlFor="email">Email</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white text-sm sm:leading-6 font-medium transition-all shadow-sm dark:bg-[#0a0a0a] dark:text-white"
                  placeholder="Địa chỉ Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <label className="sr-only" htmlFor="password">Mật khẩu</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white text-sm sm:leading-6 font-medium transition-all shadow-sm dark:bg-[#0a0a0a] dark:text-white"
                  placeholder="Mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {!isLogin && (
                <div className="relative">
                  <label className="sr-only" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-neutral-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required={!isLogin}
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white text-sm sm:leading-6 font-medium transition-all shadow-sm dark:bg-[#0a0a0a] dark:text-white"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <>
                    {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800">
            <p className="text-center text-[11px] font-medium text-slate-400 dark:text-neutral-400">
              Bằng việc {isLogin ? "đăng nhập" : "đăng ký"}, bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của chúng tôi.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
