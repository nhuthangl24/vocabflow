import { ProvidersClient } from "./ProvidersClient";

// Cache for 30s - client will load fresh data via useRealtimeLogs hook
export const revalidate = 30;

export default async function ProvidersPage() {
  return (
    <ProvidersClient
      initialLogs={[]}
      hhtechModel={process.env.HHTECH_MODEL || process.env.LLM_MODEL || "gpt-4o-mini"}
      kiraModel={process.env.KIRAAI_MODEL || "deepseek-v4-flash-free"}
    />
  );
}
