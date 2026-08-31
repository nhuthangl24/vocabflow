"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Zap, Activity, AlertTriangle, CheckCircle2, XCircle, Clock, Download,
  RefreshCw, Search, Filter, ChevronDown, TrendingUp, TrendingDown,
  AlertCircle, Server, Database, Shield, Cpu, Globe, BarChart3,
  ArrowUpRight, ArrowDownRight, Radio, Terminal, HardDrive, Wifi,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderConfig {
  key: string; name: string; baseUrl: string; model: string;
  apiKeyMasked: string; apiKeyConfigured: boolean; tasks: string[];
  color: string; logAliases: string[];
}

interface ProviderMetrics {
  providerKey: string; totalRequests: number; todayRequests: number;
  successCount: number; errorCount: number; retryCount: number; fallbackCount: number;
  avgLatency: number; p95Latency: number;
  totalInputTokens: number; totalOutputTokens: number; totalTokens: number;
  totalCredits: number; todayCredits: number; totalCostVND: number;
  rpm: number; lastRequestAt: string | null;
  successRate: number; errorRate: number;
  status: "healthy" | "warning" | "offline";
  count429: number; count500: number; countTimeout: number;
  recentErrors: string[];
}

interface ModelMetrics {
  model: string; provider: string; totalRequests: number;
  successCount: number; errorCount: number;
  totalInputTokens: number; totalOutputTokens: number; totalTokens: number;
  avgLatency: number; totalCredits: number; totalCostVND: number;
  successRate: number; lastUsedAt: string | null;
  retryCount: number; fallbackCount: number;
}

interface HourlyBucket {
  hour: string; requests: number; tokens: number;
  credits: number; avgLatency: number; errors: number;
}

interface LogRow {
  id: string; created_at: string; user_id: string | null;
  provider: string; model: string; task_type: string;
  input_tokens: number; output_tokens: number;
  latency_ms: number; cost_usd: number; status: string;
  error_message: string | null; is_retry: boolean; is_fallback: boolean;
  http_status: number | null; trace_id: string | null; job_id: string | null;
}

interface Alert { level: "error" | "warning" | "info"; message: string; provider?: string; }

interface PingResult { provider: string; status: "healthy" | "warning" | "offline"; latencyMs: number | null; error: string | null; checkedAt: string; }

interface Props {
  providers: ProviderConfig[];
  providerMetrics: Record<string, ProviderMetrics>;
  modelMetrics: ModelMetrics[];
  hourlyBuckets: HourlyBucket[];
  recentLogs: LogRow[];
  topUsers: { userId: string; totalTokens: number; totalCredits: number; requests: number }[];
  alerts: Alert[];
  globalStats: { totalRequests: number; totalTokens: number; totalCredits: number; todayCredits: number; totalCostVND: number; avgLatency: number; successRate: number; };
  systemInfo: { pendingTasks: number; failedTasks: number; routingConfig: Record<string, string>; limits: { daily: number; monthly: number }; };
  costRates: Record<string, { in: number; out: number }>;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmt(n: number): string { return n.toLocaleString("vi-VN"); }
function fmtMs(ms: number): string { return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`; }
function fmtCredits(c: number): string { return c >= 1000 ? `${(c / 1000).toFixed(2)}K` : c.toFixed(1); }
function fmtVND(credits: number): string {
  // 1 credit = 1 VND
  if (credits >= 1_000_000) return `${(credits / 1_000_000).toFixed(2)}M`;
  if (credits >= 1_000) return `${(credits / 1_000).toFixed(1)}K`;
  return credits.toFixed(0);
}
function calcCredits(log: LogRow, rates?: Record<string, { in: number; out: number }>): number {
  if (log.cost_usd && Number(log.cost_usd) > 0) return Number(log.cost_usd);
  const p = (log.provider || "").toLowerCase();
  
  if (rates && rates[p]) {
    return (Number(log.input_tokens) * rates[p].in) / 1_000_000 + (Number(log.output_tokens) * rates[p].out) / 1_000_000;
  }
  
  if (p === "hhtech" || p === "anthropic") {
    return (Number(log.input_tokens) * 900) / 1_000_000 + (Number(log.output_tokens) * 4500) / 1_000_000;
  }
  return 0;
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ─── Micro-chart components ───────────────────────────────────────────────────

function SparkBar({ values, color = "#6366f1", height = 32 }: { values: number[]; color?: string; height?: number }) {
  if (!values || values.length === 0) return <div className="h-8 flex items-end gap-px">{Array(24).fill(0).map((_, i) => <div key={i} className="flex-1 bg-neutral-800/60 rounded-sm" style={{ height: "4px" }} />)}</div>;
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all duration-300"
          style={{ height: `${Math.max(2, (v / max) * height)}px`, backgroundColor: color, opacity: 0.4 + (v / max) * 0.6 }} />
      ))}
    </div>
  );
}

function SparkLine({ values, color = "#6366f1" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1), min = Math.min(...values, 0), range = max - min || 1;
  const W = 120, H = 32;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-24 h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: "healthy" | "warning" | "offline" }) {
  const cfg = {
    healthy: { dot: "bg-emerald-500", label: "HEALTHY", cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    warning: { dot: "bg-amber-500", label: "WARNING", cls: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
    offline: { dot: "bg-red-500", label: "OFFLINE", cls: "text-red-400 border-red-500/20 bg-red-500/10" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "healthy" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

// ─── Provider Health Card ─────────────────────────────────────────────────────

function ProviderCard({ prov, metrics, pingStatus }: { prov: ProviderConfig; metrics?: ProviderMetrics; pingStatus?: PingResult }) {
  const m = metrics;
  const effectiveStatus: "healthy" | "warning" | "offline" = pingStatus?.status || m?.status || "healthy";
  const borderColor = effectiveStatus === "healthy" ? "border-neutral-800/60" : effectiveStatus === "warning" ? "border-amber-500/20" : "border-red-500/20";

  return (
    <div className={`relative rounded-xl border ${borderColor} bg-[#0a0a0a] overflow-hidden transition-all duration-300 hover:border-neutral-700`}>
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${prov.color}, transparent)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm border border-neutral-800" style={{ backgroundColor: `${prov.color}20` }}>
              <span style={{ color: prov.color }}>{prov.name.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">{prov.name}</h3>
                {m && m.rpm > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                    <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-neutral-500">{prov.model}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {prov.tasks.map((t) => (
                  <span key={t} className="px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-500 uppercase tracking-wider">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <StatusDot status={effectiveStatus} />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-neutral-800/60">
          <MetricCell label="Avg Latency" value={m ? fmtMs(m.avgLatency) : "—"} sub={m ? `P95: ${fmtMs(m.p95Latency)}` : undefined} />
          <MetricCell label="Success Rate" value={m ? `${m.successRate.toFixed(1)}%` : "—"} trend={m && m.successRate < 95 ? "down" : "up"} />
          <MetricCell label="Requests" value={m ? fmt(m.totalRequests) : "—"} sub={m ? `Today: ${fmt(m.todayRequests)}` : undefined} />
          <MetricCell label="RPM" value={m ? String(m.rpm) : "—"} sub="last 60s" />
          <MetricCell label="Tokens" value={m ? fmtCredits(m.totalTokens) : "—"} sub={m ? `In: ${fmtCredits(m.totalInputTokens)} / Out: ${fmtCredits(m.totalOutputTokens)}` : undefined} />
          <MetricCell label="Credits" value={m ? fmtCredits(m.totalCredits) : "—"} sub={m ? `${fmtVND(m.totalCredits)} VNĐ` : undefined} accent />
        </div>

        {/* Error indicators */}
        {m && (m.count429 > 0 || m.count500 > 0 || m.countTimeout > 0) && (
          <div className="mt-3 pt-3 border-t border-neutral-800/60 flex gap-3 text-xs">
            {m.count429 > 0 && <span className="text-amber-400">429: {m.count429}</span>}
            {m.count500 > 0 && <span className="text-red-400">5xx: {m.count500}</span>}
            {m.countTimeout > 0 && <span className="text-orange-400">Timeout: {m.countTimeout}</span>}
            {m.fallbackCount > 0 && <span className="text-indigo-400">Fallback: {m.fallbackCount}</span>}
          </div>
        )}

        {/* Ping latency */}
        {pingStatus && (
          <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500">
            <span>Last ping: {pingStatus.error || (pingStatus.latencyMs ? `${pingStatus.latencyMs}ms` : "—")}</span>
            <span>{timeAgo(pingStatus.checkedAt)}</span>
          </div>
        )}

        {/* API Key */}
        <div className="mt-3 pt-3 border-t border-neutral-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">API Key</span>
            <span className={`font-mono text-[10px] ${prov.apiKeyConfigured ? "text-emerald-500/70" : "text-red-500/70"}`}>
              {prov.apiKeyMasked}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Base URL</span>
            <span className="font-mono text-[10px] text-neutral-600 truncate max-w-[200px]">
              {prov.baseUrl.replace("https://", "")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, sub, trend, accent }: { label: string; value: string; sub?: string; trend?: "up" | "down"; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-0.5">{label}</div>
      <div className={`text-base font-mono font-semibold ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
        {trend && <span className={`ml-1 text-xs ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>{trend === "up" ? "↑" : "↓"}</span>}
      </div>
      {sub && <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Alert Banner ────────────────────────────────────────────────────────────

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
          a.level === "error" ? "bg-red-500/5 border-red-500/20 text-red-300" :
          a.level === "warning" ? "bg-amber-500/5 border-amber-500/20 text-amber-300" :
          "bg-blue-500/5 border-blue-500/20 text-blue-300"
        }`}>
          {a.level === "error" ? <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> :
           a.level === "warning" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> :
           <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Global Metric Cards ──────────────────────────────────────────────────────

function GlobalMetricCard({ label, value, sub, icon: Icon, trend, color = "text-indigo-400" }: any) {
  return (
    <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] hover:border-neutral-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{label}</div>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-semibold text-white tracking-tight">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-1 flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  );
}

// ─── Chart Section ────────────────────────────────────────────────────────────

function ChartSection({ title, data, valueKey, color, unit = "" }: { title: string; data: HourlyBucket[]; valueKey: keyof HourlyBucket; color: string; unit?: string }) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const total = values.reduce((a, v) => a + v, 0);
  return (
    <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{title}</div>
        <div className="text-xs font-mono text-neutral-500">{unit}{total.toLocaleString("vi-VN")} total</div>
      </div>
      <div className="flex items-end gap-0.5 h-16">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end group relative">
            <div
              className="rounded-t-sm transition-all duration-200"
              style={{ height: `${Math.max(2, (v / max) * 56)}px`, backgroundColor: color, opacity: 0.5 + (v / max) * 0.5 }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-neutral-800 border border-neutral-700 text-[9px] text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              {data[i]?.hour}: {v.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-600">
        <span>{data[0]?.hour}</span>
        <span>24h</span>
        <span>{data[data.length - 1]?.hour}</span>
      </div>
    </div>
  );
}

// ─── Model Breakdown Table ────────────────────────────────────────────────────

function ModelBreakdownTable({ models, providers }: { models: ModelMetrics[]; providers: ProviderConfig[] }) {
  const [sortKey, setSortKey] = useState<keyof ModelMetrics>("totalRequests");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => [...models].sort((a, b) => {
    const av = a[sortKey] as any, bv = b[sortKey] as any;
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  }), [models, sortKey, sortDir]);

  function toggleSort(k: keyof ModelMetrics) {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  }
  function SH({ k, label }: { k: keyof ModelMetrics; label: string }) {
    const active = sortKey === k;
    return (
      <th className={`px-4 py-3 font-medium text-left cursor-pointer select-none hover:text-neutral-300 transition-colors ${active ? "text-indigo-400" : "text-neutral-500"}`}
        onClick={() => toggleSort(k)}>
        {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  const providerColors = Object.fromEntries(providers.map(p => [p.key, p.color]));

  return (
    <div className="rounded-xl border border-neutral-800/60 overflow-hidden bg-[#0a0a0a]">
      <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Model Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-neutral-400">
          <thead className="bg-neutral-900/20 text-[10px] uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <SH k="model" label="Model" />
              <SH k="provider" label="Provider" />
              <SH k="totalRequests" label="Requests" />
              <SH k="totalInputTokens" label="In Tok" />
              <SH k="totalOutputTokens" label="Out Tok" />
              <SH k="totalTokens" label="Total Tok" />
              <SH k="avgLatency" label="Avg Latency" />
              <SH k="successRate" label="Success%" />
              <SH k="totalCredits" label="Credit" />
              <SH k="totalCostVND" label="VNĐ" />
              <th className="px-4 py-3 font-medium text-left text-neutral-500">Last Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {sorted.map((m, i) => (
              <tr key={i} className="hover:bg-neutral-900/20 transition-colors">
                <td className="px-4 py-3 font-mono text-white font-medium whitespace-nowrap">{m.model}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-neutral-700 bg-neutral-800"
                    style={{ color: providerColors[m.provider] || "#9ca3af" }}>
                    {m.provider}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">{fmt(m.totalRequests)}</td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">{fmtCredits(m.totalInputTokens)}</td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">{fmtCredits(m.totalOutputTokens)}</td>
                <td className="px-4 py-3 font-mono whitespace-nowrap text-neutral-300 font-semibold">{fmtCredits(m.totalTokens)}</td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">{fmtMs(m.avgLatency)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`font-mono ${m.successRate >= 95 ? "text-emerald-400" : m.successRate >= 80 ? "text-amber-400" : "text-red-400"}`}>
                    {m.successRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-emerald-400 whitespace-nowrap">{fmtCredits(m.totalCredits)}</td>
                <td className="px-4 py-3 font-mono text-emerald-400/70 whitespace-nowrap">{fmtVND(m.totalCredits)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{m.lastUsedAt ? timeAgo(m.lastUsedAt) : "—"}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-neutral-600">No model data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Request Log Table ────────────────────────────────────────────────────────

function RequestLogTable({ initialLogs, providers, rates }: { initialLogs: LogRow[]; providers: ProviderConfig[]; rates: Record<string, { in: number; out: number }> }) {
  const [logs, setLogs] = useState<LogRow[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [live, setLive] = useState(true);

  // Realtime subscription
  useEffect(() => {
    if (!live) return;
    const supabase = createClient();
    const ch = supabase.channel("providers-logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_api_logs" }, (p) => {
        setLogs((prev) => [p.new as LogRow, ...prev].slice(0, 500));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [live]);

  const models = useMemo(() => ["all", ...Array.from(new Set(logs.map((l) => l.model).filter(Boolean)))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const ms = search.toLowerCase();
      const matchSearch = !ms || l.provider?.toLowerCase().includes(ms) || l.model?.toLowerCase().includes(ms) ||
        l.task_type?.toLowerCase().includes(ms) || l.user_id?.toLowerCase().includes(ms) ||
        (l.trace_id || "").toLowerCase().includes(ms) || (l.error_message || "").toLowerCase().includes(ms);
      const matchProvider = filterProvider === "all" || (l.provider || "").toLowerCase().includes(filterProvider);
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      const matchModel = filterModel === "all" || l.model === filterModel;
      return matchSearch && matchProvider && matchStatus && matchModel;
    });
  }, [logs, search, filterProvider, filterStatus, filterModel]);

  // CSV export
  const exportCSV = useCallback(() => {
    const header = "Timestamp,User,Provider,Model,Task,InputTokens,OutputTokens,Latency(ms),Credits,Status,Retry,Fallback,Error,TraceID";
    const rows = filtered.map((l) => [
      l.created_at, l.user_id || "", l.provider, l.model, l.task_type,
      l.input_tokens, l.output_tokens, l.latency_ms, calcCredits(l, rates).toFixed(3),
      l.status, l.is_retry ? "1" : "0", l.is_fallback ? "1" : "0",
      `"${(l.error_message || "").replace(/"/g, "'")}"`, l.trace_id || "",
    ].join(",")).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ai-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const providerKeys = providers.map((p) => p.key);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider, model, user, trace ID..."
            className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-all" />
        </div>
        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-indigo-500">
          <option value="all">All Providers</option>
          {providerKeys.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
        </select>
        <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-indigo-500">
          {models.map(m => <option key={m} value={m}>{m === "all" ? "All Models" : m}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-indigo-500">
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        <button onClick={() => setLive(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${live ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}>
          <Radio className={`w-3 h-3 ${live ? "animate-pulse" : ""}`} />
          {live ? "LIVE" : "PAUSED"}
        </button>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
        <span className="text-xs text-neutral-600 ml-auto">{filtered.length} rows</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-800/60 overflow-hidden bg-[#0a0a0a]">
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-xs text-neutral-400">
            <thead className="sticky top-0 bg-neutral-950 text-[10px] uppercase tracking-wider border-b border-neutral-800/60 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Time</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">User</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Provider</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Model</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Task</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500 whitespace-nowrap">In Tok</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500 whitespace-nowrap">Out Tok</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500 whitespace-nowrap">Latency</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500 whitespace-nowrap">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Flags</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {filtered.slice(0, 200).map((log) => (
                <tr key={log.id} className="hover:bg-neutral-900/20 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap text-neutral-500 font-mono">{timeAgo(log.created_at)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-neutral-500">
                    {log.user_id ? `${log.user_id.slice(0, 8)}…` : "anon"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[9px] font-bold uppercase tracking-wider text-neutral-300">
                      {(log.provider || "—").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-neutral-300">{log.model || "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-neutral-400">{log.task_type || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">{fmt(log.input_tokens || 0)}</td>
                  <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">{fmt(log.output_tokens || 0)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono whitespace-nowrap ${Number(log.latency_ms) > 5000 ? "text-red-400" : Number(log.latency_ms) > 2000 ? "text-amber-400" : "text-neutral-300"}`}>
                    {fmtMs(Number(log.latency_ms) || 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap text-emerald-400/80">{calcCredits(log, rates).toFixed(2)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border uppercase ${log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex gap-1">
                      {log.is_retry && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">RETRY</span>}
                      {log.is_fallback && <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">FALLBACK</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 max-w-[180px] truncate text-red-400/70" title={log.error_message || ""}>
                    {log.error_message || ""}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-neutral-600">No logs match the current filters</td></tr>
              )}
              {filtered.length > 200 && (
                <tr><td colSpan={12} className="px-4 py-3 text-center text-neutral-600 text-[10px]">Showing first 200 of {filtered.length} rows</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Cost Settings Panel ──────────────────────────────────────────────────────

function CostSettingsPanel({ initialRates }: { initialRates: Record<string, { in: number; out: number }> }) {
  // Unified rate: single credits/1M value (same for in and out)
  const [unified, setUnified] = useState<Record<string, number>>(() => {
    const u: Record<string, number> = {};
    for (const [p, r] of Object.entries(initialRates || {})) {
      // Use average of in+out if they differ, otherwise just use one
      u[p] = r.in === r.out ? r.in : Math.round((r.in + r.out) / 2);
    }
    return u;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const providers = ["hhtech", "anthropic", "kiraai", "groq", "openai"];

  const handleSave = async () => {
    setSaving(true);
    // Convert unified → { in, out } both equal (no cache distinction)
    const rates: Record<string, { in: number; out: number }> = {};
    for (const [p, v] of Object.entries(unified)) {
      rates[p] = { in: v, out: v };
    }
    try {
      const res = await fetch("/api/admin/provider-settings", {
        method: "POST",
        body: JSON.stringify({ rates }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch(e) {
      console.error("Failed to save cost rates", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Cost Settings</h3>
          <p className="text-[10px] text-neutral-600 mt-0.5">Credits per 1M tokens (không cache)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Config"}
        </button>
      </div>
      <div className="divide-y divide-neutral-800/60">
        {providers.map(p => (
          <div key={p} className="flex items-center justify-between px-5 py-3">
            <div className="text-sm text-neutral-300 uppercase font-semibold tracking-wider w-28">{p}</div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">Credits / 1M tokens</span>
              <input
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={unified[p] ?? 0}
                onChange={e => {
                  const num = Number(e.target.value);
                  setUnified(r => ({ ...r, [p]: isNaN(num) ? 0 : num }));
                }}
                className="w-32 px-3 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 outline-none rounded-lg text-xs text-white font-mono text-right"
              />
              {(unified[p] ?? 0) > 0 && (
                <span className="text-[10px] text-neutral-600 min-w-[80px]">
                  ≈ {((unified[p] ?? 0) / 1_000_000).toFixed(6)} VNĐ/token
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── System Status Panel ─────────────────────────────────────────────────────

function SystemStatusPanel({ systemInfo, pingResults, costRates }: { systemInfo: Props["systemInfo"]; pingResults: Record<string, PingResult>; costRates: Record<string, { in: number; out: number }> }) {
  type StatusLevel = "healthy" | "warning" | "offline";
  const items: { label: string; status: StatusLevel; detail?: string; icon: any }[] = [
    { label: "Database (Supabase)", status: "healthy", detail: "PostgreSQL connected", icon: Database },
    { label: "Authentication", status: "healthy", detail: "Supabase Auth active", icon: Shield },
    { label: "Queue (Tasks)", status: systemInfo.failedTasks > 10 ? "warning" : "healthy", detail: `${systemInfo.pendingTasks} pending / ${systemInfo.failedTasks} failed`, icon: Activity },
    { label: "Background Workers", status: systemInfo.pendingTasks > 50 ? "warning" : "healthy", detail: `${systemInfo.pendingTasks} pending jobs`, icon: Cpu },
    { label: "Storage (Supabase)", status: "healthy", detail: "Object storage available", icon: HardDrive },
    { label: "Network / Internet", status: "healthy", detail: "Reachable", icon: Globe },
  ];

  const statusCfg: Record<StatusLevel, { icon: any; cls: string }> = {
    healthy: { icon: CheckCircle2, cls: "text-emerald-400" },
    warning: { icon: AlertTriangle, cls: "text-amber-400" },
    offline: { icon: XCircle, cls: "text-red-400" },
  };

  return (
    <div className="space-y-6">
      {/* Infrastructure */}
      <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Infrastructure Health</h3>
        </div>
        <div className="divide-y divide-neutral-800/60">
          {items.map((item, i) => {
            const SI = statusCfg[item.status];
            return (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-neutral-500" />
                  <div>
                    <div className="text-sm text-neutral-200">{item.label}</div>
                    {item.detail && <div className="text-xs text-neutral-500 mt-0.5">{item.detail}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SI.icon className={`w-4 h-4 ${SI.cls}`} />
                  <span className={`text-xs font-medium ${SI.cls}`}>{item.status.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider live ping results */}
      <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Provider Live Ping</h3>
          <span className="text-[10px] text-neutral-600">Updates every 60s</span>
        </div>
        {Object.keys(pingResults).length === 0 ? (
          <div className="px-5 py-6 text-center text-xs text-neutral-600">Pinging providers…</div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {Object.values(pingResults).map((r, i) => {
              const SI = statusCfg[r.status];
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-neutral-500" />
                    <div>
                      <div className="text-sm text-neutral-200 uppercase font-medium">{r.provider}</div>
                      {r.error && <div className="text-xs text-red-400/70 mt-0.5">{r.error}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.latencyMs !== null && (
                      <span className={`font-mono text-xs ${r.latencyMs > 3000 ? "text-red-400" : r.latencyMs > 1000 ? "text-amber-400" : "text-emerald-400"}`}>
                        {r.latencyMs}ms
                      </span>
                    )}
                    <SI.icon className={`w-4 h-4 ${SI.cls}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routing config */}
      <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Task → Provider Routing</h3>
        </div>
        <div className="divide-y divide-neutral-800/60">
          {Object.entries(systemInfo.routingConfig).map(([task, provider]) => (
            <div key={task} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-neutral-400 capitalize">{task}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase">{provider}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost limits */}
      <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Cost Limits (ENV)</h3>
        </div>
        <div className="divide-y divide-neutral-800/60">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-neutral-400">DAILY_AI_COST_LIMIT_USD</span>
            <span className="font-mono text-xs text-amber-400">${systemInfo.limits.daily}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-neutral-400">MONTHLY_AI_COST_LIMIT_USD</span>
            <span className="font-mono text-xs text-amber-400">${systemInfo.limits.monthly}</span>
          </div>
        </div>
      </div>

      <CostSettingsPanel initialRates={costRates} />
    </div>
  );
}

// ─── Top Users Table ──────────────────────────────────────────────────────────

function TopUsersTable({ users }: { users: Props["topUsers"] }) {
  if (users.length === 0) return <div className="text-xs text-neutral-600 py-4 text-center">No user data</div>;
  const maxTokens = Math.max(...users.map(u => u.totalTokens), 1);
  return (
    <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Top Token Consumers</h3>
      </div>
      <div className="divide-y divide-neutral-800/60">
        {users.slice(0, 8).map((u, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <span className="text-xs text-neutral-600 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-neutral-300 truncate">{u.userId === "anonymous" ? "Anonymous" : `${u.userId.slice(0, 8)}…`}</div>
              <div className="mt-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500/60 rounded-full" style={{ width: `${(u.totalTokens / maxTokens) * 100}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xs text-white">{fmtCredits(u.totalTokens)} tok</div>
              <div className="font-mono text-[10px] text-emerald-400/70">{fmtCredits(u.totalCredits)} cr</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Success Rate Bar ─────────────────────────────────────────────────────────

function SuccessRateBar({ data }: { data: HourlyBucket[] }) {
  const getStatusColor = (rate: number, reqs: number) => {
    if (reqs === 0) return "bg-[#1f2937]";
    if (rate >= 95) return "bg-[#10b981]";
    if (rate >= 90) return "bg-[#f59e0b]";
    if (rate >= 70) return "bg-[#f97316]";
    return "bg-[#ef4444]";
  };

  return (
    <div className="p-6 rounded-xl border border-neutral-800/60 bg-[#121214] shadow-lg">
      <h3 className="font-bold text-lg text-white">Tỷ lệ thành công trong 24 giờ qua</h3>
      <p className="text-sm text-neutral-400 mt-1 mb-6">Request success rate, last 24h</p>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 h-8">
          {data.map((d, i) => {
            const successRate = d.requests > 0 ? ((d.requests - d.errors) / d.requests) * 100 : 0;
            return (
              <div 
                key={i}
                className={`flex-1 rounded-sm ${getStatusColor(successRate, d.requests)}`}
                title={`${d.hour}: ${d.requests > 0 ? successRate.toFixed(1) : 0}% (${d.requests - d.errors}/${d.requests})`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-neutral-500 font-medium">
          <span>24h trước (24h ago)</span>
          <span>Hiện tại (now)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-8 mt-6 pt-5 border-t border-neutral-800/60 text-sm">
        <div className="flex items-center gap-2 text-neutral-300">
          <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
          <span className="font-bold">{'>'}95%</span> Ổn định
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
          <span className="font-bold">90–95%</span> Suy giảm
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <div className="w-3 h-3 rounded-sm bg-[#f97316]" />
          <span className="font-bold">70–90%</span> Kém ổn định
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
          <span className="font-bold">{'<'}70%</span> Sự cố
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <div className="w-3 h-3 rounded-sm bg-[#1f2937]" />
          Chưa có dữ liệu (No data)
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "overview" | "analytics" | "requests" | "status" | "alerts";

export function ProvidersClient({ providers, providerMetrics, modelMetrics, hourlyBuckets, recentLogs, topUsers, alerts, globalStats, systemInfo, costRates }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});
  const [pinging, setPinging] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const doPing = useCallback(async () => {
    setPinging(true);
    try {
      const res = await fetch("/api/admin/provider-ping");
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, PingResult> = {};
        for (const r of json.pings) map[r.provider] = r;
        setPingResults(map);
        setLastRefresh(new Date());
      }
    } finally {
      setPinging(false);
    }
  }, []);

  useEffect(() => {
    doPing();
    const interval = setInterval(doPing, 60000);
    return () => clearInterval(interval);
  }, [doPing]);

  const errorAlerts = alerts.filter((a) => a.level === "error");
  const warnAlerts = alerts.filter((a) => a.level === "warning");
  const alertCount = alerts.length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "requests", label: "Request Log" },
    { id: "status", label: "System Status" },
    { id: "alerts", label: "Alerts", badge: alertCount },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            AI Providers
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            AI observability dashboard — last refresh: {isMounted ? lastRefresh.toLocaleTimeString("vi-VN") : "--:--"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <button
              onClick={() => setTab("alerts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:opacity-80 ${errorAlerts.length > 0 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {alertCount} alert{alertCount > 1 ? "s" : ""}
            </button>
          )}
          <button onClick={doPing} disabled={pinging}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${pinging ? "animate-spin" : ""}`} />
            Ping
          </button>
        </div>
      </div>


      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-neutral-800/60">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${tab === t.id ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-red-500 text-white" : "bg-red-500/20 text-red-400"}`}>
                {t.badge}
              </span>
            )}
            {tab === t.id && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Global KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <GlobalMetricCard label="Total Requests" value={fmt(globalStats.totalRequests)} icon={Activity} color="text-indigo-400" />
            <GlobalMetricCard label="Success Rate" value={`${globalStats.successRate.toFixed(1)}%`} icon={CheckCircle2} color="text-emerald-400" />
            <GlobalMetricCard label="Avg Latency" value={fmtMs(globalStats.avgLatency)} icon={Clock} color="text-blue-400" />
            <GlobalMetricCard label="Total Tokens" value={fmtCredits(globalStats.totalTokens)} sub="input + output" icon={BarChart3} color="text-amber-400" />
            <GlobalMetricCard label="Credits Used" value={fmtCredits(globalStats.totalCredits)} sub={`Today: ${fmtCredits(globalStats.todayCredits)}`} icon={Zap} color="text-emerald-400" />
            <GlobalMetricCard label="Cost (VNĐ)" value={fmtVND(globalStats.totalCredits)} sub={`Hôm nay: ${fmtVND(globalStats.todayCredits)} VNĐ`} icon={TrendingUp} color="text-purple-400" />
          </div>

          

          {/* Provider cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {providers.map((prov) => (
              <ProviderCard key={prov.key} prov={prov} metrics={providerMetrics[prov.key]} pingStatus={pingResults[prov.key]} />
            ))}
            {providers.length === 0 && (
              <div className="col-span-3 text-center py-12 text-neutral-600 text-sm">No providers configured in ENV</div>
            )}
          </div>

          {/* Model breakdown */}
          <ModelBreakdownTable models={modelMetrics} providers={providers} />
        </div>
      )}

      {/* ── Tab: Analytics ── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartSection title="Requests / Hour (24h)" data={hourlyBuckets} valueKey="requests" color="#6366f1" />
            <ChartSection title="Tokens / Hour (24h)" data={hourlyBuckets} valueKey="tokens" color="#f59e0b" />
            <ChartSection title="Credits / Hour (24h)" data={hourlyBuckets} valueKey="credits" color="#34d399" />
            <ChartSection title="Avg Latency / Hour (24h)" data={hourlyBuckets} valueKey="avgLatency" color="#f87171" unit="ms avg " />
          </div>
          <ChartSection title="Errors / Hour (24h)" data={hourlyBuckets} valueKey="errors" color="#ef4444" />

          {/* Provider comparison */}
          <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Provider Comparison</h3>
            </div>
            <div className="divide-y divide-neutral-800/60">
              {providers.map((prov) => {
                const m = providerMetrics[prov.key];
                if (!m) return null;
                const maxReq = Math.max(...providers.map(p => providerMetrics[p.key]?.totalRequests || 0), 1);
                return (
                  <div key={prov.key} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-20 shrink-0 text-xs font-bold uppercase" style={{ color: prov.color }}>{prov.name}</div>
                    <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(m.totalRequests / maxReq) * 100}%`, backgroundColor: prov.color }} />
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-mono text-white">{fmt(m.totalRequests)} req</div>
                      <div className="text-[10px] text-neutral-500">{fmtMs(m.avgLatency)} avg</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <TopUsersTable users={topUsers} />
        </div>
      )}

      {/* ── Tab: Request Log ── */}
      {tab === "requests" && (
        <RequestLogTable initialLogs={recentLogs} providers={providers} rates={costRates} />
      )}

      {/* ── Tab: System Status ── */}
      {tab === "status" && (
        <SystemStatusPanel systemInfo={systemInfo} pingResults={pingResults} costRates={costRates} />
      )}

      {/* ── Tab: Alerts ── */}
      {tab === "alerts" && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
              <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/40" />
              <p className="text-sm font-medium">Không có cảnh báo nào</p>
              <p className="text-xs mt-1">Hệ thống đang hoạt động bình thường.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Critical</div>
                  <div className="text-3xl font-bold text-red-400">{errorAlerts.length}</div>
                </div>
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Warning</div>
                  <div className="text-3xl font-bold text-amber-400">{warnAlerts.length}</div>
                </div>
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Info</div>
                  <div className="text-3xl font-bold text-blue-400">{alerts.filter(a => a.level === "info").length}</div>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
                  <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Danh sách cảnh báo</h3>
                </div>
                <div className="divide-y divide-neutral-800/60">
                  {alerts.map((a, i) => (
                    <div key={i} className={`flex items-start gap-4 px-5 py-4 ${
                      a.level === "error" ? "bg-red-500/3" : a.level === "warning" ? "bg-amber-500/3" : ""
                    }`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        a.level === "error" ? "bg-red-500" : a.level === "warning" ? "bg-amber-500" : "bg-blue-500"
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          a.level === "error" ? "text-red-300" : a.level === "warning" ? "text-amber-300" : "text-blue-300"
                        }`}>{a.message}</p>
                        {a.provider && (
                          <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 uppercase font-bold">
                            {a.provider}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        a.level === "error" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        a.level === "warning" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                        "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>{a.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
