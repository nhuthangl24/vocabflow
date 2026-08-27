"use client";

import { Flame, BrainCircuit, CheckCircle2, Target, CalendarDays, BarChart3, Lock } from "lucide-react";
import Link from "next/link";

export default function AnalyticsClient({ vocabCount }: { vocabCount: number }) {
  // Generate mock heatmap data for exactly 365 days
  const today = new Date();
  const days = Array.from({ length: 365 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (364 - i));
    
    // Khởi tạo intensity = 0 (Không fake data)
    let intensity = 0;
    
    return {
      date: d,
      intensity
    };
  });

  const getMonthLabels = () => {
    const labels = [];
    let currentMonth = -1;
    for (let i = 0; i < days.length; i++) {
      const month = days[i].date.getMonth();
      if (month !== currentMonth && (days.length - i > 15)) { // Don't show label if too close to end
        labels.push({
          label: `Tháng ${month + 1}`,
          index: i
        });
        currentMonth = month;
      }
    }
    return labels;
  };

  const monthLabels = getMonthLabels();

  // Helper to split into weeks (7 days per column)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColorClass = (intensity: number) => {
    switch(intensity) {
      case 0: return "bg-slate-100 dark:bg-neutral-900";
      case 1: return "bg-emerald-200 dark:bg-emerald-900/40";
      case 2: return "bg-emerald-300 dark:bg-emerald-700/60";
      case 3: return "bg-emerald-400 dark:bg-emerald-500/80";
      case 4: return "bg-emerald-500 dark:bg-emerald-400";
      default: return "bg-slate-100 dark:bg-neutral-900";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto mb-safe">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
          Thống kê học tập
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
          Theo dõi tiến độ và duy trì thói quen học tập mỗi ngày
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Streak Card */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col hover:shadow-md transition-shadow dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Chuỗi ngày học</h2>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-neutral-400">ngày</span>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-neutral-800/60 flex justify-between items-center text-xs font-semibold dark:border-neutral-800">
            <span className="text-slate-400 dark:text-slate-500 dark:text-neutral-400">Kỷ lục: 1 ngày</span>
          </div>
        </div>

        {/* Learned Words Card */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col hover:shadow-md transition-shadow dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Từ đã thuộc</h2>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-neutral-800/60 flex justify-between items-center text-xs font-semibold dark:border-neutral-800">
            <span className="text-slate-400 dark:text-slate-500 dark:text-neutral-400">trên tổng {vocabCount || 333} từ</span>
          </div>
        </div>

        {/* Completed Lessons Card */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col hover:shadow-md transition-shadow dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Bài hoàn thành</h2>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">0/15</span>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-neutral-800/60 flex justify-between items-center text-xs font-semibold dark:border-neutral-800">
            <span className="text-slate-400 dark:text-slate-500 dark:text-neutral-400">Xong khi học đủ 2 chế độ</span>
          </div>
        </div>

        {/* Today Card */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col hover:shadow-md transition-shadow dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-sky-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Hôm nay</h2>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-neutral-400">câu</span>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-neutral-800/60 flex justify-between items-center text-xs font-semibold dark:border-neutral-800">
            <span className="text-slate-400 dark:text-slate-500 dark:text-neutral-400">Số câu trả lời đúng trong ngày</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Heatmap Area (Takes up 2 columns on large screens) */}
        {/* Heatmap Area (Full width to avoid scrolling) */}
        <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col items-center dark:border-neutral-700">
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-neutral-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Lịch học</h2>
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider bg-slate-50 dark:bg-neutral-900 px-2 py-1 rounded dark:bg-[#0a0a0a]">12 tháng gần đây</span>
          </div>
          
          <div className="w-full max-w-[1000px] mx-auto overflow-x-auto custom-scrollbar pb-2">
            <div className="inline-flex flex-col min-w-max mx-auto">
              {/* Months Row */}
              <div className="flex ml-8 mb-2 h-4 relative">
                {monthLabels.map((lbl, idx) => {
                  const weekIndex = Math.floor(lbl.index / 7);
                  return (
                    <div 
                      key={idx} 
                      className="absolute text-[11px] font-medium text-neutral-400"
                      style={{ left: `${weekIndex * 15}px` }}
                    >
                      {lbl.label}
                    </div>
                  );
                })}
              </div>

              {/* Grid Area */}
              <div className="flex gap-1.5">
                {/* Days of week labels */}
                <div className="flex flex-col gap-[3px] text-[10px] font-medium text-neutral-400 w-6 pt-1">
                  <div className="h-3"></div>
                  <div className="h-3 leading-[12px]">T2</div>
                  <div className="h-3"></div>
                  <div className="h-3 leading-[12px]">T4</div>
                  <div className="h-3"></div>
                  <div className="h-3 leading-[12px]">T6</div>
                  <div className="h-3"></div>
                  <div className="h-3 leading-[12px]">CN</div>
                </div>

                {/* The Grid */}
                <div className="flex gap-[3px]">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-[3px]">
                      {week.map((day, dIdx) => (
                        <div 
                          key={dIdx} 
                          className={`w-3 h-3 rounded-[2px] transition-colors ${getColorClass(day.intensity)}`}
                          title={`${day.date.toLocaleDateString('vi-VN')} - Mức độ: ${day.intensity}`}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end w-full max-w-[1000px] gap-2 text-[11px] font-medium text-neutral-400">
            <span>Ít</span>
            <div className={`w-3 h-3 rounded-[2px] ${getColorClass(0)}`}></div>
            <div className={`w-3 h-3 rounded-[2px] ${getColorClass(1)}`}></div>
            <div className={`w-3 h-3 rounded-[2px] ${getColorClass(2)}`}></div>
            <div className={`w-3 h-3 rounded-[2px] ${getColorClass(3)}`}></div>
            <div className={`w-3 h-3 rounded-[2px] ${getColorClass(4)}`}></div>
            <span>Nhiều</span>
          </div>
        </div>

        {/* Progress Category */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Tiến độ theo chủ đề</h2>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 dark:text-neutral-400">Phần đã học trên tổng nội dung</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Category: Từ vựng */}
            <div className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-100 dark:border-neutral-800 dark:bg-[#0a0a0a]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Từ vựng</span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">0/{vocabCount || 333} từ · 0%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-neutral-900 rounded-full h-2 dark:bg-neutral-800">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Category: Shadowing */}
            <div className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-100 dark:border-neutral-800 dark:bg-[#0a0a0a]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Shadowing</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/50">
                  <Lock className="w-3 h-3" /> Sắp ra mắt
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-neutral-900 rounded-full h-2 dark:bg-neutral-800">
                <div className="bg-slate-300 dark:bg-neutral-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Category: Hội thoại */}
            <div className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-100 dark:border-neutral-800 dark:bg-[#0a0a0a]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Hội thoại</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/50">
                  <Lock className="w-3 h-3" /> Sắp ra mắt
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-neutral-900 rounded-full h-2 dark:bg-neutral-800">
                <div className="bg-slate-300 dark:bg-neutral-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Category: Luyện thi chứng chỉ */}
            <div className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-100 dark:border-neutral-800 dark:bg-[#0a0a0a]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-neutral-300 dark:text-neutral-200">Luyện thi chứng chỉ</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/50">
                  <Lock className="w-3 h-3" /> Sắp ra mắt
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-neutral-900 rounded-full h-2 dark:bg-neutral-800">
                <div className="bg-slate-300 dark:bg-neutral-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
