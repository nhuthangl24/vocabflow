import { createAdminClient } from "@/lib/supabase/admin";
import { ProvidersClient } from "./ProvidersClient";

export const revalidate = 0;
export const metadata = { title: "AI Providers – Lumina Admin" };

// ── Provider Registry ──────────────────────────────────────────────────────
function maskKey(key: string | undefined): string {
  if (!key) return "Not configured";
  if (key.length <= 8) return `${key.slice(0, 2)}${"*".repeat(6)}`;
  return `${key.slice(0, 4)}${"*".repeat(12)}${key.slice(-4)}`;
}

function buildProviderRegistry() {
  const providers = [];

  const hhtechKey = process.env.HHTECH_API_KEY || process.env.LLM_API_KEY;
  const hhtechUrl = process.env.HHTECH_BASE_URL || process.env.LLM_BASE_URL;
  if (hhtechKey || hhtechUrl) {
    providers.push({
      key: "hhtech",
      name: "HHTECH",
      baseUrl: hhtechUrl || "N/A",
      model: process.env.HHTECH_MODEL || process.env.LLM_MODEL || "unknown",
      apiKeyMasked: maskKey(hhtechKey),
      apiKeyConfigured: !!hhtechKey,
      tasks: ["vocab", "grammar"],
      color: "#a78bfa",
      logAliases: ["hhtech", "anthropic", "hhtech_anthropic"],
    });
  }

  if (process.env.KIRAAI_API_KEY || process.env.KIRAAI_BASE_URL) {
    providers.push({
      key: "kiraai",
      name: "KiraAI",
      baseUrl: process.env.KIRAAI_BASE_URL || "N/A",
      model: process.env.KIRAAI_MODEL || "unknown",
      apiKeyMasked: maskKey(process.env.KIRAAI_API_KEY),
      apiKeyConfigured: !!process.env.KIRAAI_API_KEY,
      tasks: ["shadowing"],
      color: "#fbbf24",
      logAliases: ["kiraai", "kira", "unknown"],
    });
  }

  if (process.env.GROQ_API_KEY) {
    providers.push({
      key: "groq",
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama3-8b-8192",
      apiKeyMasked: maskKey(process.env.GROQ_API_KEY),
      apiKeyConfigured: true,
      tasks: [],
      color: "#34d399",
      logAliases: ["groq"],
    });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      key: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o",
      apiKeyMasked: maskKey(process.env.OPENAI_API_KEY),
      apiKeyConfigured: true,
      tasks: [],
      color: "#60a5fa",
      logAliases: ["openai"],
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      key: "anthropic",
      name: "Anthropic",
      baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1",
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
      apiKeyMasked: maskKey(process.env.ANTHROPIC_API_KEY),
      apiKeyConfigured: true,
      tasks: [],
      color: "#f97316",
      logAliases: ["anthropic_direct"],
    });
  }

  return providers;
}

// ── Normalize provider name from log to registry key ──────────────────────
function normalizeProvider(provider: string): string {
  if (!provider) return "kiraai";
  const p = provider.toLowerCase().trim();
  if (p === "hhtech" || p === "anthropic" || p === "hhtech_anthropic") return "hhtech";
  if (p === "kiraai" || p === "kira" || p === "unknown") return "kiraai";
  if (p === "groq") return "groq";
  if (p === "openai") return "openai";
  if (p === "anthropic_direct") return "anthropic";
  return p;
}

// ── Cost calculation (credits) ─────────────────────────────────────────────
export type CostRates = Record<string, { in: number; out: number }>;

function calcCredits(log: any, rates?: CostRates): number {
  if (log.cost_usd && Number(log.cost_usd) > 0) return Number(log.cost_usd);
  const provKey = normalizeProvider(log.provider || "");
  const inp = Number(log.input_tokens || 0);
  const out = Number(log.output_tokens || 0);
  
  if (rates && rates[provKey]) {
    return (inp * rates[provKey].in) / 1_000_000 + (out * rates[provKey].out) / 1_000_000;
  }
  
  if (provKey === "hhtech" || provKey === "anthropic") {
    return (inp * 900) / 1_000_000 + (out * 4500) / 1_000_000;
  }
  return 0;
}

// ── Build hourly buckets for last 24h ─────────────────────────────────────
function buildHourlyBuckets(logs: any[], rates?: CostRates) {
  const now = Date.now();
  const buckets: Record<number, { hour: string; requests: number; tokens: number; credits: number; latencySum: number; latencyCount: number; errors: number }> = {};

  for (let h = 23; h >= 0; h--) {
    const d = new Date(now - h * 3600 * 1000);
    const key = d.getHours();
    buckets[key] = {
      hour: `${String(d.getHours()).padStart(2, "0")}:00`,
      requests: 0, tokens: 0, credits: 0, latencySum: 0, latencyCount: 0, errors: 0,
    };
  }

  for (const log of logs) {
    const ts = new Date(log.created_at).getTime();
    if (now - ts > 24 * 3600 * 1000) continue;
    const h = new Date(ts).getHours();
    if (!buckets[h]) continue;
    buckets[h].requests++;
    buckets[h].tokens += (Number(log.input_tokens) || 0) + (Number(log.output_tokens) || 0);
    buckets[h].credits += calcCredits(log, rates);
    const lat = Number(log.latency_ms || (log as any).duration_ms || 0);
    if (lat > 0) { buckets[h].latencySum += lat; buckets[h].latencyCount++; }
    if (log.status !== "success") buckets[h].errors++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => {
      const now = new Date().getHours();
      const ah = Number(a), bh = Number(b);
      return ((ah - now + 24) % 24) - ((bh - now + 24) % 24);
    })
    .map(([, v]) => ({
      ...v,
      avgLatency: v.latencyCount > 0 ? Math.round(v.latencySum / v.latencyCount) : 0,
    }));
}

export default async function AdminProvidersPage() {
  const supabase = createAdminClient();

  // Fetch logs (last 1000) for full analytics
  const { data: ratesData } = await supabase.from("provider_settings").select("value").eq("key", "ai_cost_rates").single();
  const rates = (ratesData?.value as CostRates) || {};

  const { data: rawLogs } = await supabase
    .from("ai_api_logs")
    .select("id,user_id,job_id,provider,model,task_type,input_tokens,output_tokens,cost_usd,latency_ms,status,error_message,is_retry,is_fallback,http_status,trace_id,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const logs = rawLogs || [];

  // Pending tasks count for system status
  const { count: pendingTasks } = await supabase
    .from("tasks").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: failedTasks } = await supabase
    .from("tasks").select("*", { count: "exact", head: true }).eq("status", "failed");

  // ── Provider registry ──
  const providers = buildProviderRegistry();

  // ── Per-provider metrics ──
  const now = Date.now();
  const providerMetrics: Record<string, any> = {};

  for (const prov of providers) {
    const pLogs = logs.filter((l) => normalizeProvider(l.provider) === prov.key);
    const todayLogs = pLogs.filter((l) => now - new Date(l.created_at).getTime() < 86400000);
    const successLogs = pLogs.filter((l) => l.status === "success");
    const recentLogs60s = pLogs.filter((l) => now - new Date(l.created_at).getTime() < 60000);

    const latencies = successLogs.map((l) => Number(l.latency_ms || (l as any).duration_ms || 0)).filter((v) => v > 0);
    const sorted = [...latencies].sort((a, b) => a - b);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, v) => a + v, 0) / latencies.length) : 0;
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;

    const totalCredits = pLogs.reduce((a, l) => a + calcCredits(l, rates), 0);
    const todayCredits = todayLogs.reduce((a, l) => a + calcCredits(l, rates), 0);
    const totalTokens = pLogs.reduce((a, l) => a + (Number(l.input_tokens) || 0) + (Number(l.output_tokens) || 0), 0);
    const successRate = pLogs.length > 0 ? (successLogs.length / pLogs.length) * 100 : 100;
    const errorLogs = pLogs.filter((l) => l.status !== "success");
    const count429 = errorLogs.filter((l) => l.http_status === 429 || (l.error_message || "").includes("429")).length;
    const count500 = errorLogs.filter((l) => l.http_status === 500 || (l.error_message || "").includes("500")).length;
    const countTimeout = errorLogs.filter((l) => (l.error_message || "").toLowerCase().includes("timeout")).length;
    const retryCount = pLogs.filter((l) => l.is_retry).length;
    const fallbackCount = pLogs.filter((l) => l.is_fallback).length;

    let status: "healthy" | "warning" | "offline" = "healthy";
    if (successRate < 80) status = "offline";
    else if (successRate < 95 || avgLatency > 5000 || count429 > 5) status = "warning";
    if (pLogs.length === 0) status = "healthy"; // No data = assume healthy

    providerMetrics[prov.key] = {
      providerKey: prov.key,
      totalRequests: pLogs.length,
      todayRequests: todayLogs.length,
      successCount: successLogs.length,
      errorCount: errorLogs.length,
      retryCount,
      fallbackCount,
      avgLatency,
      p95Latency: p95,
      totalInputTokens: pLogs.reduce((a, l) => a + (Number(l.input_tokens) || 0), 0),
      totalOutputTokens: pLogs.reduce((a, l) => a + (Number(l.output_tokens) || 0), 0),
      totalTokens,
      totalCredits,
      todayCredits,
      totalCostVND: totalCredits / 1000,
      rpm: recentLogs60s.length,
      lastRequestAt: pLogs[0]?.created_at || null,
      successRate,
      errorRate: 100 - successRate,
      status,
      count429,
      count500,
      countTimeout,
      recentErrors: errorLogs.slice(0, 3).map((l) => l.error_message || "Unknown error").filter(Boolean),
    };
  }

  // ── Per-model metrics ──
  const modelMap: Record<string, any> = {};
  for (const log of logs) {
    const model = log.model || "unknown";
    const provKey = normalizeProvider(log.provider);
    const mk = `${model}::${provKey}`;
    if (!modelMap[mk]) {
      modelMap[mk] = {
        model, provider: provKey,
        totalRequests: 0, successCount: 0, errorCount: 0,
        totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0,
        latencySum: 0, latencyCount: 0, totalCredits: 0,
        lastUsedAt: null, retryCount: 0, fallbackCount: 0,
      };
    }
    const m = modelMap[mk];
    m.totalRequests++;
    if (log.status === "success") { m.successCount++; } else { m.errorCount++; }
    m.totalInputTokens += Number(log.input_tokens) || 0;
    m.totalOutputTokens += Number(log.output_tokens) || 0;
    m.totalTokens += (Number(log.input_tokens) || 0) + (Number(log.output_tokens) || 0);
    const lat = Number(log.latency_ms || 0);
    if (lat > 0) { m.latencySum += lat; m.latencyCount++; }
    m.totalCredits += calcCredits(log, rates);
    if (!m.lastUsedAt || log.created_at > m.lastUsedAt) m.lastUsedAt = log.created_at;
    if (log.is_retry) m.retryCount++;
    if (log.is_fallback) m.fallbackCount++;
  }

  const modelMetrics = Object.values(modelMap)
    .map((m: any) => ({
      ...m,
      avgLatency: m.latencyCount > 0 ? Math.round(m.latencySum / m.latencyCount) : 0,
      successRate: m.totalRequests > 0 ? (m.successCount / m.totalRequests) * 100 : 100,
      totalCostVND: m.totalCredits / 1000,
    }))
    .sort((a: any, b: any) => b.totalRequests - a.totalRequests);

  // ── Top users by token consumption ──
  const userMap: Record<string, { userId: string; totalTokens: number; totalCredits: number; requests: number }> = {};
  for (const log of logs) {
    const uid = log.user_id || "anonymous";
    if (!userMap[uid]) userMap[uid] = { userId: uid, totalTokens: 0, totalCredits: 0, requests: 0 };
    userMap[uid].totalTokens += (Number(log.input_tokens) || 0) + (Number(log.output_tokens) || 0);
    userMap[uid].totalCredits += calcCredits(log, rates);
    userMap[uid].requests++;
  }
  const topUsers = Object.values(userMap).sort((a, b) => b.totalTokens - a.totalTokens).slice(0, 10);

  // ── Hourly buckets ──
  const hourlyBuckets = buildHourlyBuckets(logs);

  // ── Global stats ──
  const totalRequests = logs.length;
  const totalSuccessLogs = logs.filter((l) => l.status === "success");
  const totalCredits = logs.reduce((a, l) => a + calcCredits(l, rates), 0);
  const totalTokens = logs.reduce((a, l) => a + (Number(l.input_tokens) || 0) + (Number(l.output_tokens) || 0), 0);
  const allLatencies = totalSuccessLogs.map((l) => Number(l.latency_ms || 0)).filter((v) => v > 0);
  const avgLatency = allLatencies.length ? Math.round(allLatencies.reduce((a, v) => a + v, 0) / allLatencies.length) : 0;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter((l) => new Date(l.created_at) >= todayStart);
  const todayCredits = todayLogs.reduce((a, l) => a + calcCredits(l, rates), 0);

  // ── Alerts ──
  const alerts: { level: "error" | "warning" | "info"; message: string; provider?: string }[] = [];

  const totalDailyLimit = Number(process.env.DAILY_AI_COST_LIMIT_USD || 10) * 1000; // convert to credits rough equiv
  if (todayCredits > totalDailyLimit * 0.8) {
    alerts.push({ level: "warning", message: `Chi phí AI hôm nay đạt ${((todayCredits / totalDailyLimit) * 100).toFixed(0)}% giới hạn ngày` });
  }
  for (const prov of providers) {
    const m = providerMetrics[prov.key];
    if (!m) continue;
    if (m.status === "offline" && m.totalRequests > 0) {
      alerts.push({ level: "error", message: `Provider ${prov.name} có tỷ lệ lỗi cao (${(100 - m.successRate).toFixed(1)}%)`, provider: prov.key });
    }
    if (m.count429 > 10) {
      alerts.push({ level: "warning", message: `${prov.name}: ${m.count429} lỗi 429 Rate Limited trong period này`, provider: prov.key });
    }
    if (m.countTimeout > 5) {
      alerts.push({ level: "warning", message: `${prov.name}: ${m.countTimeout} lỗi Timeout — kiểm tra kết nối`, provider: prov.key });
    }
  }

  return (
    <ProvidersClient
      providers={providers}
      providerMetrics={providerMetrics}
      modelMetrics={modelMetrics}
      hourlyBuckets={hourlyBuckets}
      costRates={rates}
      recentLogs={logs.slice(0, 500)}
      topUsers={topUsers}
      alerts={alerts}
      globalStats={{
        totalRequests,
        totalTokens,
        totalCredits,
        todayCredits,
        totalCostVND: totalCredits / 1000,
        avgLatency,
        successRate: totalRequests > 0 ? (totalSuccessLogs.length / totalRequests) * 100 : 100,
      }}
      systemInfo={{
        pendingTasks: pendingTasks || 0,
        failedTasks: failedTasks || 0,
        routingConfig: {
          shadowing: process.env.SHADOWING_PROVIDER || "kiraai",
          vocab: process.env.VOCAB_PROVIDER || "hhtech",
          grammar: process.env.GRAMMAR_PROVIDER || "hhtech",
        },
        limits: {
          daily: Number(process.env.DAILY_AI_COST_LIMIT_USD || 10),
          monthly: Number(process.env.MONTHLY_AI_COST_LIMIT_USD || 100),
        },
      }}
    />
  );
}
