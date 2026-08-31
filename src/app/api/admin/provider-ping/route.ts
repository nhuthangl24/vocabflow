import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 5000;

interface PingResult {
  provider: string;
  status: "healthy" | "warning" | "offline";
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

async function pingProvider(name: string, baseUrl: string, apiKey?: string): Promise<PingResult> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  if (!apiKey) {
    return { provider: name, status: "offline", latencyMs: null, error: "API key not configured", checkedAt };
  }

  if (!baseUrl || baseUrl === "N/A") {
    return { provider: name, status: "offline", latencyMs: null, error: "Base URL not configured", checkedAt };
  }

  try {
    const url = baseUrl.endsWith("/") ? `${baseUrl}models` : `${baseUrl}/models`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - start;

    if (res.ok || res.status === 404) {
      // 404 on /models is fine — provider is up, just doesn't expose model list
      return {
        provider: name,
        status: latencyMs > 3000 ? "warning" : "healthy",
        latencyMs,
        error: null,
        checkedAt,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return { provider: name, status: "warning", latencyMs: Date.now() - start, error: `Auth error ${res.status}`, checkedAt };
    }

    if (res.status === 429) {
      return { provider: name, status: "warning", latencyMs: Date.now() - start, error: "Rate limited (429)", checkedAt };
    }

    return { provider: name, status: "warning", latencyMs: Date.now() - start, error: `HTTP ${res.status}`, checkedAt };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    if (err?.name === "AbortError") {
      return { provider: name, status: "offline", latencyMs: TIMEOUT_MS, error: `Timeout after ${TIMEOUT_MS}ms`, checkedAt };
    }
    return { provider: name, status: "offline", latencyMs, error: err?.message || "Connection failed", checkedAt };
  }
}

export async function GET(_req: NextRequest) {
  // Dynamically discover providers from ENV
  const checks: Promise<PingResult>[] = [];

  if (process.env.HHTECH_API_KEY || process.env.LLM_API_KEY) {
    checks.push(pingProvider(
      "hhtech",
      process.env.HHTECH_BASE_URL || process.env.LLM_BASE_URL || "",
      process.env.HHTECH_API_KEY || process.env.LLM_API_KEY
    ));
  }

  if (process.env.KIRAAI_API_KEY) {
    checks.push(pingProvider(
      "kiraai",
      process.env.KIRAAI_BASE_URL || "",
      process.env.KIRAAI_API_KEY
    ));
  }

  if (process.env.GROQ_API_KEY) {
    checks.push(pingProvider(
      "groq",
      "https://api.groq.com/openai/v1",
      process.env.GROQ_API_KEY
    ));
  }

  if (process.env.OPENAI_API_KEY) {
    checks.push(pingProvider(
      "openai",
      "https://api.openai.com/v1",
      process.env.OPENAI_API_KEY
    ));
  }

  if (process.env.ANTHROPIC_API_KEY) {
    checks.push(pingProvider(
      "anthropic",
      process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1",
      process.env.ANTHROPIC_API_KEY
    ));
  }

  const results = await Promise.allSettled(checks);
  const pings = results.map((r) =>
    r.status === "fulfilled" ? r.value : { provider: "unknown", status: "offline" as const, latencyMs: null, error: "Check failed", checkedAt: new Date().toISOString() }
  );

  return NextResponse.json({ pings, timestamp: new Date().toISOString() });
}
