"use client";

import Link from 'next/link';
import { Home, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030712] selection:bg-indigo-500/30">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse duration-10000" />
      <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-violet-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse duration-10000 delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/5 rounded-full mix-blend-screen filter blur-[120px]" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0ZjQ2ZTUiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djI2aC0ydi0yNmgteXItMnYtMnYtMnYtMnYtMmgydjJoMjZ2MmgtMjZ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto w-full">
        {/* Glowing 404 */}
        <div className="relative group mb-4">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-500"></div>
          <h1 className="relative text-8xl md:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter drop-shadow-2xl select-none">
            404
          </h1>
        </div>
        
        {/* Content */}
        <h2 className="mt-6 text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          Oops! Lạc vào hố đen vũ trụ... 🌌
        </h2>
        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị chuyển đi nơi khác. Hãy quay lại quỹ đạo an toàn nhé.
        </p>
        
        {/* Actions */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
          <Link 
            href="/dashboard"
            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-50 transition-all hover:scale-105 w-full sm:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <LayoutDashboard className="w-5 h-5" />
            Về Dashboard
          </Link>

          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold hover:bg-white/10 transition-all hover:scale-105 backdrop-blur-md w-full sm:w-auto group"
          >
            <Home className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            Trang chủ
          </Link>
        </div>

        {/* Back Button */}
        <div className="mt-16">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  );
}
