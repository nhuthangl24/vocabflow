"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function DevToolsDetector() {
  const router = useRouter();
  const banTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isDevToolsOpen = false;

    // Chặn chuột phải và các phím tắt F12, Ctrl+Shift+I
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      const isOpen = widthDiff || heightDiff;

      if (isOpen) {
        // Liên tục xóa console để cản trở đọc data
        console.clear();
        console.warn("%c[SECURITY] Vui lòng đóng Developer Tools. Tài khoản của bạn sẽ bị khóa sau 60 giây nếu tiếp tục vi phạm.", "color: red; font-size: 20px; font-weight: bold;");
      }

      if (isOpen && !isDevToolsOpen) {
        isDevToolsOpen = true;
        setIsDetected(true);
        setCountdown(60);
        
        // Bắt đầu đếm ngược 60s
        banTimeoutRef.current = setTimeout(async () => {
          try {
            const res = await fetch('/api/anti-cheat/ban', { method: 'POST' });
            if (res.ok) {
              const data = await res.json();
              if (data.bypassed) {
                console.log("Ban bypassed for Admin.");
              } else {
                router.push('/login?banned=true');
              }
            }
          } catch (e) {
            console.error(e);
          }
        }, 60000);
      } else if (!isOpen && isDevToolsOpen) {
        isDevToolsOpen = false;
        setIsDetected(false);
        if (banTimeoutRef.current) {
          clearTimeout(banTimeoutRef.current);
          banTimeoutRef.current = null;
        }
      }
    };

    const interval = setInterval(checkDevTools, 50);
    window.addEventListener('resize', checkDevTools);

    // Cập nhật số giây đếm ngược hiển thị trên UI
    const countdownInterval = setInterval(() => {
      if (isDevToolsOpen) {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
      window.removeEventListener('resize', checkDevTools);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      if (banTimeoutRef.current) clearTimeout(banTimeoutRef.current);
    };
  }, [router]);

  if (!isDetected) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl text-white">
      <div className="flex flex-col items-center max-w-lg text-center p-8 bg-neutral-900/40 border border-neutral-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
        <h1 className="text-3xl font-black mb-4 uppercase tracking-wider text-white">
          Cảnh Báo Bảo Mật
        </h1>
        <p className="text-lg text-neutral-300 mb-8 font-medium">
          Hệ thống phát hiện bạn đang mở Developer Tools (F12). Việc can thiệp vào mã nguồn là vi phạm điều khoản sử dụng. Vui lòng đóng cửa sổ này ngay lập tức!
        </p>
        
        <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 w-full shadow-inner">
          <div className="text-neutral-400 text-sm font-semibold mb-2 uppercase tracking-widest">Thời gian còn lại</div>
          <div className="text-6xl font-black text-white tabular-nums tracking-tighter">
            00:{countdown.toString().padStart(2, '0')}
          </div>
        </div>

        <p className="mt-8 text-sm text-neutral-500 font-medium">
          Tài khoản của bạn sẽ bị khóa (ban) viễn viễn nếu bộ đếm về 0.
        </p>
      </div>
    </div>
  );
}
