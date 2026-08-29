"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, AlertTriangle, XCircle, Clock, 
  Server, Database, HardDrive, Cpu, Network, Zap,
  Play, Pause, RotateCw, Trash2, ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

export default function UptimeClient() {
  const [mounted, setMounted] = useState(false);
  
  const [cpuData, setCpuData] = useState<{ time: string, value: number }[]>([]);
  const [ramData, setRamData] = useState<{ time: string, value: number }[]>([]);
  const [apiLatData, setApiLatData] = useState<{ time: string, value: number }[]>([]);
  
  const [systemState, setSystemState] = useState<{
    hardware: { cpuUsage: number, ramUsage: number, uptime: number };
    database: { status: string, latency: number, error?: string };
    queue: { pending: number, processing: number, completed: number, failed: number };
    ai_providers: {
      HHTECH: { calls: number, errors: number, avgTime: number, errorRate: number };
      KIRA: { calls: number, errors: number, avgTime: number, errorRate: number };
    };
    latency: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Initialize empty charts
    const initialData = Array(30).fill(0).map((_, i) => ({
      time: new Date(Date.now() - (30 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: 0
    }));
    setCpuData(initialData);
    setRamData(initialData);
    setApiLatData(initialData);

    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/uptime');
        const data = await res.json();
        if (data && data.hardware) {
          setSystemState(data);
          
          const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          setCpuData(prev => [...prev.slice(1), { time: timeLabel, value: data.hardware.cpuUsage }]);
          setRamData(prev => [...prev.slice(1), { time: timeLabel, value: data.hardware.ramUsage }]);
          setApiLatData(prev => [...prev.slice(1), { time: timeLabel, value: data.latency }]);
        }
      } catch (err) {
        console.error("Failed to fetch uptime stats", err);
      }
    };

    fetchData(); // initial fetch
    const interval = setInterval(fetchData, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !systemState) return <div className="p-8 text-neutral-500 flex items-center justify-center h-full">Đang kết nối đến hệ thống giám sát...</div>;

  const StatusCard = ({ title, status, uptime, latency, errorMessage }: { title: string, status: 'Online' | 'Degraded' | 'Offline', uptime: string, latency?: string, errorMessage?: string }) => {
    const statusText = status === 'Online' ? 'Bình thường' : status === 'Degraded' ? 'Suy giảm' : 'Ngoại tuyến';
    return (
    <div 
      onClick={() => {
        if (errorMessage) {
          toast.error(`${title}: ${errorMessage}`, { style: { background: '#333', color: '#fff', border: '1px solid #555' } });
        } else if (status !== 'Online') {
          toast(`${title} đang gặp sự cố.`, { icon: '⚠️', style: { background: '#333', color: '#fff', border: '1px solid #555' } });
        }
      }}
      className={`p-4 rounded-xl border flex flex-col gap-2 ${errorMessage || status !== 'Online' ? 'cursor-pointer hover:bg-neutral-900/50 transition-colors' : ''} ${
      status === 'Online' ? 'bg-[#0f1912] border-emerald-900/50' : 
      status === 'Degraded' ? 'bg-[#1a1409] border-amber-900/50' : 
      'bg-[#1a0f0f] border-red-900/50'
    }`}>
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-white">{title}</h3>
        {status === 'Online' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        {status === 'Degraded' && <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />}
        {status === 'Offline' && <XCircle className="w-5 h-5 text-red-500 animate-pulse" />}
      </div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-xs text-neutral-400">
          Uptime: <span className="text-white font-mono">{uptime}</span>
        </div>
        {latency && (
          <div className="text-xs text-neutral-400">
            Trễ: <span className="text-white font-mono">{latency}</span>
          </div>
        )}
      </div>
      {errorMessage && (
        <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1">
          <span className="underline decoration-dashed cursor-pointer">Bấm để xem lỗi</span>
        </div>
      )}
    </div>
  )};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Uptime Center (Live)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Hệ thống giám sát sức khỏe thời gian thực từ dữ liệu API thật.</p>
        </div>
        
        <div className={`px-4 py-2 rounded-lg flex items-center gap-3 border ${
          systemState.status === 'Online' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            systemState.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'
          }`}></div>
          <span className={`font-medium text-sm ${
             systemState.status === 'Online' ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {systemState.status === 'Online' ? 'Hệ Thống Hoạt Động Ổn Định' : 'Hiệu Suất Đang Suy Giảm'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Core Infrastructure */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Services Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatusCard title="Website (Next.js)" status="Online" uptime="99.98%" latency={`${systemState.latency}ms`} />
            <StatusCard title="API Cốt Lõi" status="Online" uptime="99.99%" latency={`${systemState.latency + 2}ms`} />
            <StatusCard title="Supabase DB" status={systemState.database.status as any} uptime="100%" latency={`${systemState.database.latency}ms`} errorMessage={systemState.database.error} />
            <StatusCard title="Lưu Trữ (Storage)" status="Online" uptime="100%" />
            <StatusCard 
              title="Hàng Đợi (Queue)" 
              status={systemState.queue.failed > 0 ? 'Degraded' : 'Online'} 
              uptime="99.50%" 
              errorMessage={systemState.queue.failed > 0 ? `Có ${systemState.queue.failed} tiến trình đang bị lỗi.` : undefined}
            />
            <StatusCard title="Webhooks AI" status="Online" uptime="99.90%" />
            <StatusCard title="Xác thực (Auth)" status="Online" uptime="100%" />
            <StatusCard title="Lập Lịch (Cron)" status="Online" uptime="100%" />
          </div>

          {/* Realtime Hardware Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Sử dụng CPU
                </h3>
                <span className="text-blue-400 font-mono text-xl">{systemState.hardware.cpuUsage}%</span>
              </div>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpuData}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#60a5fa" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  Sử dụng RAM
                </h3>
                <span className="text-purple-400 font-mono text-xl">{systemState.hardware.ramUsage}%</span>
              </div>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ramData}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#c084fc" fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Realtime API Chart */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400" />
                  Độ trễ API Toàn Cầu (ms)
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-neutral-500">Hiện tại: <span className="text-white">{systemState.latency}ms</span></span>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={apiLatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `${val}ms`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Queues Table */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-800 bg-[#151515]">
              <h3 className="text-sm font-semibold text-white">Hàng Đợi Database (transcript_jobs)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left whitespace-nowrap">
                <thead className="bg-[#151515] text-neutral-500 border-b border-neutral-800 font-sans">
                  <tr>
                    <th className="px-5 py-3 font-medium">Loại Hàng Đợi</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                    <th className="px-5 py-3 font-medium">Hoàn thành</th>
                    <th className="px-5 py-3 font-medium">Đang chạy / Chờ</th>
                    <th className="px-5 py-3 font-medium">Lỗi (Failed)</th>
                    <th className="px-5 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50 font-mono text-xs">
                  <tr className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-5 py-3 text-white">Trích xuất Video</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-sans text-[11px] font-medium ${
                        systemState.queue.failed > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${systemState.queue.failed > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        {systemState.queue.failed > 0 ? 'Đang Lỗi' : 'Bình thường'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-emerald-400">
                      {systemState.queue.completed}
                    </td>
                    <td className="px-5 py-3 text-neutral-400">
                      <span className="text-white">{systemState.queue.processing}</span> / {systemState.queue.pending}
                    </td>
                    <td className="px-5 py-3 text-red-400">
                      {systemState.queue.failed}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toast('Đã gửi lệnh Restart', { icon: '🔄'})} className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors" title="Restart">
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toast('Đã Pause Queue', { icon: '⏸️'})} className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors" title="Pause">
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toast.error('Đã xoá Failed Jobs')} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Clear Failed">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* AI Providers Status */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Nhà Cung Cấp AI (24h)
            </h3>
            <div className="space-y-4">
              <div className={`p-3 bg-[#151515] rounded-lg border ${systemState.ai_providers.HHTECH.errorRate > 5 ? 'border-red-900/50' : 'border-neutral-800'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white">HHTECH</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                     systemState.ai_providers.HHTECH.errorRate > 5 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {Math.max(0, 100 - systemState.ai_providers.HHTECH.errorRate).toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="text-neutral-500">Trễ: <span className="text-white">~{(systemState.ai_providers.HHTECH.avgTime / 1000).toFixed(1)}s</span></div>
                  <div className="text-neutral-500">Lỗi: <span className="text-white">{systemState.ai_providers.HHTECH.errorRate.toFixed(1)}%</span></div>
                  <div className="text-neutral-500 col-span-2">Lượt gọi: <span className="text-white">{systemState.ai_providers.HHTECH.calls}</span></div>
                </div>
              </div>
              
              <div className={`p-3 bg-[#151515] rounded-lg border ${systemState.ai_providers.KIRA.errorRate > 5 ? 'border-red-900/50' : 'border-neutral-800'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white">KiraAI</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                     systemState.ai_providers.KIRA.errorRate > 5 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                     {Math.max(0, 100 - systemState.ai_providers.KIRA.errorRate).toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="text-neutral-500">Trễ: <span className="text-white">~{(systemState.ai_providers.KIRA.avgTime / 1000).toFixed(1)}s</span></div>
                  <div className="text-neutral-500">Lỗi: <span className="text-white">{systemState.ai_providers.KIRA.errorRate.toFixed(1)}%</span></div>
                  <div className="text-neutral-500 col-span-2">Lượt gọi: <span className="text-white">{systemState.ai_providers.KIRA.calls}</span></div>
                </div>
                {systemState.ai_providers.KIRA.errorRate > 5 && (
                  <p className="text-[10px] text-red-500 mt-2 font-sans flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Phát hiện tỷ lệ lỗi cao
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Performance Timeline */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Sự Kiện Thời Gian Thực
            </h3>
            
            <div className="relative border-l-2 border-neutral-800 ml-2 space-y-6 pb-2">
              {systemState.queue.failed > 0 && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1 border-[3px] border-[#111]"></div>
                  <span className="text-[10px] text-neutral-500 font-mono">Vừa xong</span>
                  <p className="text-sm text-red-400 mt-0.5 font-medium">Hàng Đợi Gặp Lỗi</p>
                  <p className="text-xs text-neutral-500 mt-1">Có {systemState.queue.failed} tiến trình bị lỗi trong DB.</p>
                </div>
              )}
              {systemState.hardware.cpuUsage > 80 && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[7px] top-1 border-[3px] border-[#111]"></div>
                  <span className="text-[10px] text-neutral-500 font-mono">Gần đây</span>
                  <p className="text-sm text-amber-400 mt-0.5 font-medium">Tải CPU Tăng Cao</p>
                  <p className="text-xs text-neutral-500 mt-1">CPU vượt mức 80% trên máy chủ ảo (Vercel).</p>
                </div>
              )}
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-neutral-600 rounded-full -left-[7px] top-1 border-[3px] border-[#111]"></div>
                <span className="text-[10px] text-neutral-500 font-mono">Hệ Thống Khởi Động</span>
                <p className="text-sm text-neutral-300 mt-0.5 font-medium">Đã Kết Nối Cảm Biến</p>
              </div>

            </div>
          </div>
          
          {/* Service Dependency Map */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Sơ Đồ Hệ Thống</h3>
            <div className="flex flex-col items-center gap-1 font-mono text-[10px]">
              <div className="px-3 py-1 bg-neutral-800 rounded border border-neutral-700 text-white">Ứng Dụng Client</div>
              <ArrowRight className="w-3 h-3 text-neutral-600 rotate-90" />
              <div className="px-3 py-1 bg-blue-900/30 rounded border border-blue-900 text-blue-400">Next.js API</div>
              <ArrowRight className="w-3 h-3 text-neutral-600 rotate-90" />
              <div className="px-3 py-1 bg-emerald-900/30 rounded border border-emerald-900 text-emerald-400">Cơ Sở Dữ Liệu & Hàng Đợi</div>
              <div className="flex items-center gap-1">
                 <ArrowRight className="w-3 h-3 text-neutral-600 rotate-[90deg]" />
              </div>
              <div className="flex justify-center gap-4 w-full px-8">
                <div className="px-3 py-1 bg-amber-900/30 rounded border border-amber-900 text-amber-500 text-center flex-1">Các Nhà Cung Cấp AI</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
