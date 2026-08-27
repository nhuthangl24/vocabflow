"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Camera, User, Mail, Shield, KeyRound } from "lucide-react";

type SettingsFormProps = {
  user: any;
};

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password.trim() !== "" && password !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu nhập lại không khớp." });
      setIsLoading(false);
      return;
    }

    try {
      let finalAvatarUrl = avatarUrl;

      // If there's a new file, upload it first
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = data.publicUrl;
      }

      const updates: any = {
        data: { full_name: fullName, avatar_url: finalAvatarUrl }
      };
      
      if (password.trim() !== "") {
        updates.password = password;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;
      
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
      setPassword(""); 
      setConfirmPassword("");
      setAvatarFile(null); 
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Đã có lỗi xảy ra." });
    } finally {
      setIsLoading(false);
    }
  };

  const displayAvatar = previewUrl || avatarUrl;

  return (
    <form onSubmit={handleSave} className="w-full space-y-10 p-6 sm:p-8 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm mb-12">
      
      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/30 dark:border-rose-800/50'}`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-neutral-800 pb-4">
          <User className="w-5 h-5 text-slate-400 dark:text-neutral-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h3>
        </div>
        
        <div className="space-y-8">
          {/* Avatar Display & Input */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-800 shadow-md dark:bg-neutral-900">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-bold text-2xl dark:bg-neutral-800">
                    {fullName ? fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U")}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Ảnh đại diện</h4>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mb-3">Nhấp vào ảnh để tải lên từ thiết bị (JPG, PNG, WEBP). Khuyến nghị kích thước vuông 256x256.</p>
              <input 
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {avatarFile && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-neutral-700">
                  <Camera className="w-3.5 h-3.5" />
                  {avatarFile.name}
                </span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-neutral-300">
                <User className="w-4 h-4 text-slate-400" />
                Tên hiển thị
              </label>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nhu Thang"
                className="w-full h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-shadow" 
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-neutral-300">
                <Mail className="w-4 h-4 text-slate-400" />
                Địa chỉ Email
              </label>
              <input 
                type="email" 
                disabled 
                value={user?.email || ""} 
                className="w-full h-11 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl px-4 text-sm text-slate-500 dark:text-neutral-500 cursor-not-allowed shadow-sm" 
              />
              <p className="text-xs text-slate-400 dark:text-neutral-500 font-medium">Email không thể thay đổi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-neutral-800 pb-4">
          <Shield className="w-5 h-5 text-slate-400 dark:text-neutral-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bảo mật tài khoản</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-neutral-300">
              <KeyRound className="w-4 h-4 text-slate-400" />
              Mật khẩu mới
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Bỏ trống nếu không muốn đổi"
              className="w-full h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-shadow" 
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-neutral-300">
              <Shield className="w-4 h-4 text-slate-400" />
              Xác nhận mật khẩu
            </label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-shadow" 
            />
          </div>
        </div>
      </section>

      <div className="pt-6 flex justify-end">
        <button 
          type="submit"
          disabled={isLoading}
          className="bg-slate-900 dark:bg-white text-white dark:text-[#0a0a0a] px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-neutral-200 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </div>
    </form>
  );
}
