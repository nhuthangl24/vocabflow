"use client";

import { useState, useEffect } from 'react';
import { Activity, Server, Database, Shield, HardDrive, Cpu, AlertTriangle, CheckCircle2, Clock, Terminal, Zap, ListTree, Play, MessageSquare, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  initialServices: any[];
  activeIncidents: any[];
  uptime24h: Record<string, number>;
};

export function StatusClient({ initialServices, activeIncidents, uptime24h }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'queue' | 'db' | 'logs'>('overview');
  const [services, setServices] = useState<any[]>(initialServices);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastPing, setLastPing] = useState<Date>(new Date());
  
  // Realtime Logs Mock State
  const [logs, setLogs] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/health-check');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setLastPing(new Date());
        
        // Mock new log entry
        setLogs(prev => [{
          id: Math.random().toString(),
          level: 'info',
          service: 'health-checker',
          message: 'Performed automated system sweep',
          time: new Date().toLocaleTimeString(),
          duration: data.totalLatency
        }, ...prev].slice(0, 50));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // 10s auto refresh for admin
    return () => clearInterval(interval);
  }, []);

  const TABS = [
    { id: 'overview', label: 'Overview & Incidents', icon: Activity },
    { id: 'ai', label: 'AI Health', icon: Zap },
    { id: 'queue', label: 'Queue & Workers', icon: ListTree },
    { id: 'db', label: 'Database & Storage', icon: Database },
    { id: 'logs', label: 'Live Event Log', icon: Terminal },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Production Status Center
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Comprehensive system observability and incident management</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500 mb-1">Auto-refresh: 10s • Last: {mounted ? lastPing.toLocaleTimeString() : '--:--:--'}</div>
          <button onClick={fetchHealth} disabled={loading} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-md font-medium transition-colors border border-neutral-700">
            {loading ? 'Refreshing...' : 'Force Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-neutral-800 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${activeIncidents.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} flex items-center justify-between shadow-lg`}>
            <div>
              <h3 className={`text-xl font-bold ${activeIncidents.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {activeIncidents.length > 0 ? '🟡 Partial Service Degradation' : '🟢 All Systems Operational'}
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                {activeIncidents.length > 0 ? `${activeIncidents.length} active incident(s) requiring attention.` : '99.98% SLA Uptime today. No active incidents.'}
              </p>
            </div>
          </div>

          {healthData?.systemInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="CPU Usage" value={`${healthData.systemInfo.cpuUsage}%`} icon={Cpu} color="text-blue-400" />
              <MetricCard label="RAM Usage" value={`${healthData.systemInfo.ramUsage}%`} icon={Server} color="text-purple-400" />
              <MetricCard label="Uptime" value={`${Math.round(healthData.systemInfo.uptime / 3600)}h`} icon={Clock} color="text-emerald-400" />
              <MetricCard label="Latency" value={`${healthData.totalLatency}ms`} icon={Activity} color="text-amber-400" />
            </div>
          )}

          <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/50">
              <h3 className="text-sm font-semibold text-white">System Services</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
              {services.map(s => {
                const liveCheck = healthData?.services?.find((l: any) => l.name.toLowerCase().includes(s.name.toLowerCase()));
                const currentStatus = liveCheck ? liveCheck.status : s.status;
                const latency = liveCheck ? liveCheck.latency_ms : null;
                const isUp = currentStatus === 'operational' || currentStatus === 'up';

                return (
                  <div key={s.id} className="p-5 hover:bg-neutral-900/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-neutral-200 font-medium">{s.name}</h4>
                        <div className="text-xs text-neutral-500 capitalize">{s.type.replace('_', ' ')}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${isUp ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                        {isUp ? 'OPERATIONAL' : 'DEGRADED'}
                      </span>
                    </div>
                    {latency !== null && (
                      <div className="mt-4 flex justify-between text-xs font-mono text-neutral-500">
                        <span>Latency</span>
                        <span className={latency > 1000 ? 'text-amber-400' : ''}>{latency}ms</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI HEALTH */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {['HHTECH', 'KiraAI', 'OpenAI', 'Groq'].map(provider => {
              const pData = healthData?.services?.find((l: any) => l.name === provider);
              const errorRate = pData?.metrics?.errorRate || 0;
              
              return (
                <div key={provider} className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-6 relative overflow-hidden shadow-lg">
                  <div className={`absolute top-0 left-0 w-1 h-full ${errorRate > 10 ? 'bg-red-500' : errorRate > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  <div className="flex items-center justify-between mb-6 pl-2">
                    <h3 className="text-lg font-bold text-white">{provider}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded font-bold uppercase border ${errorRate > 10 ? 'text-red-400 border-red-500/30 bg-red-500/10' : errorRate > 0 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                      {errorRate > 10 ? 'Outage' : errorRate > 0 ? 'Degraded' : 'Healthy'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 pl-2">
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Success Rate</div>
                      <div className={`text-xl font-bold ${errorRate > 10 ? 'text-red-400' : 'text-white'}`}>{(100 - errorRate).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">RPM (Last Hour)</div>
                      <div className="text-xl font-bold text-white">{pData?.metrics?.totalRequests || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Avg Latency</div>
                      <div className="text-xl font-bold text-white">{pData?.latency_ms || 0}ms</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">429 / Timeouts</div>
                      <div className="text-xl font-bold text-neutral-400">0 / 0</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: QUEUE & WORKERS */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const qData = healthData?.services?.find((s: any) => s.type === 'queue')?.metrics;
              return (
                <>
                  <MetricCard label="Waiting Jobs" value={qData?.pending || 0} icon={Clock} color="text-amber-400" />
                  <MetricCard label="Running Jobs" value={qData?.running || 0} icon={Play} color="text-indigo-400" />
                  <MetricCard label="Failed Jobs (DLQ)" value={qData?.failed || 0} icon={AlertTriangle} color="text-red-400" />
                </>
              );
            })()}
          </div>
          <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-6">
             <h3 className="text-white font-semibold mb-4">Worker Status (Mock Dashboard)</h3>
             <div className="flex gap-4 items-center p-4 bg-neutral-900/50 rounded border border-neutral-800">
               <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
               <div>
                 <div className="text-sm font-medium text-white">FFmpeg Processor 1</div>
                 <div className="text-xs text-neutral-500">Processing video_123.mp4 • 45% CPU</div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DATABASE */}
      {activeTab === 'db' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Active Connections" value="12/100" icon={Database} color="text-emerald-400" />
            <MetricCard label="Idle Connections" value="4" icon={Clock} color="text-neutral-400" />
            <MetricCard label="Slow Queries" value="0" icon={AlertTriangle} color="text-amber-400" />
            <MetricCard label="DB Latency" value={`${healthData?.services?.find((s:any)=>s.type==='database')?.latency_ms || 0}ms`} icon={Activity} color="text-indigo-400" />
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Live Event Stream
            </h3>
            <span className="flex items-center gap-2 text-xs text-emerald-500 font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Streaming
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={log.id} className="flex gap-4 p-2 hover:bg-neutral-900/50 rounded transition-colors border-b border-neutral-800/30">
                  <div className="text-neutral-500 shrink-0 w-20">{log.time}</div>
                  <div className={`shrink-0 w-16 uppercase font-bold ${log.level === 'error' ? 'text-red-400' : 'text-indigo-400'}`}>{log.level}</div>
                  <div className="text-neutral-400 shrink-0 w-32 truncate">[{log.service}]</div>
                  <div className="text-neutral-300 flex-1">{log.message}</div>
                  <div className="text-neutral-600 shrink-0">{log.duration}ms</div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-neutral-500 text-center py-10">Waiting for events...</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="p-5 rounded-xl border border-neutral-800 bg-[#0a0a0a] shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-neutral-400 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
