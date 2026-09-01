"use client";

import { useState } from "react";
import { Send, AlertCircle, CheckCircle2, MessageSquare, Bot } from "lucide-react";
import { testTelegramAction } from "@/app/actions/telegram";

export function TelegramStatusWidget({ isConnected, chatId }: { isConnected: boolean, chatId: string | null }) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testTelegramAction("Đây là tin nhắn test từ Admin Dashboard!");
      if (res.success) {
        setTestResult({ success: true, message: "Gửi tin nhắn thành công!" });
      } else {
        setTestResult({ success: false, message: res.error || "Có lỗi xảy ra" });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="col-span-1 border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40 flex flex-col">
      <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" /> Telegram Notification
        </h3>
        {isConnected ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Disconnected
          </span>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 flex items-center gap-2">
              <Bot className="w-4 h-4" /> Bot Token
            </span>
            <span className="text-neutral-300 font-mono text-xs">
              {isConnected ? "•••••••••• Cấu hình OK" : "Chưa cấu hình"}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Chat ID
            </span>
            <span className="text-neutral-300 font-mono text-xs">
              {chatId ? `${chatId.substring(0, 4)}...${chatId.slice(-3)}` : "Chưa cấu hình"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800/60 mt-auto">
          <button
            onClick={handleTest}
            disabled={!isConnected || isTesting}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              isConnected 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg disabled:opacity-50' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {isTesting ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Send className="w-4 h-4" />
            )}
            Test Send Message
          </button>
          
          {testResult && (
            <div className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-start gap-2 ${
              testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
