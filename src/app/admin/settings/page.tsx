import { createAdminClient } from "@/lib/supabase/admin";
import SystemSettingsClient from "./SystemSettingsClient";

export const revalidate = 60;
export const metadata = { title: "Cài Đặt Hệ Thống – Lumina Admin" };

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();

  const [
    { data: providerSettings },
    { count: totalUsers },
    { count: totalJobs },
    { count: totalVocab },
    { count: totalAiLogs },
  ] = await Promise.all([
    supabase.from("provider_settings").select("id, key, value").order("key"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("transcript_jobs").select("*", { count: "exact", head: true }),
    supabase.from("vocabulary_items").select("*", { count: "exact", head: true }),
    supabase.from("ai_api_logs").select("*", { count: "exact", head: true }),
  ]);

  const envInfo = {
    nodeEnv: process.env.NODE_ENV || "development",
    nextVersion: "16",
    region: process.env.VERCEL_REGION || process.env.FLY_REGION || "local",
    shadowingProvider: process.env.SHADOWING_PROVIDER || "",
    vocabProvider: process.env.VOCAB_PROVIDER || "",
    grammarProvider: process.env.GRAMMAR_PROVIDER || "",
    kiraModelConfigured: !!(process.env.KIRAAI_API_KEY && process.env.KIRAAI_BASE_URL),
    hhtechConfigured: !!(
      (process.env.HHTECH_API_KEY || process.env.LLM_API_KEY) &&
      (process.env.HHTECH_BASE_URL || process.env.LLM_BASE_URL)
    ),
    anthropicConfigured: !!(process.env.ANTHROPIC_API_KEY),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://unknown.supabase.co",
  };

  return (
    <SystemSettingsClient
      providerSettings={providerSettings ?? []}
      envInfo={envInfo}
      systemStats={{
        totalUsers: totalUsers ?? 0,
        totalJobs: totalJobs ?? 0,
        totalVocab: totalVocab ?? 0,
        totalAiLogs: totalAiLogs ?? 0,
        dbTableCount: 22, // tracked tables in migrations
      }}
    />
  );
}
