"use client";

import { useState } from "react";
import {
  Settings,
  Zap,
  Shield,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  Clock,
  DollarSign,
} from "lucide-react";

interface ProviderSetting {
  id: string;
  key: string;
  value: any;
}

interface Props {
  providerSettings: ProviderSetting[];
  envInfo: {
    nodeEnv: string;
    nextVersion: string;
    region: string;
    shadowingProvider: string;
    vocabProvider: string;
    grammarProvider: string;
    kiraModelConfigured: boolean;
    hhtechConfigured: boolean;
    anthropicConfigured: boolean;
    supabaseUrl: string;
  };
  systemStats: {
    totalUsers: number;
    totalJobs: number;
    totalVocab: number;
    totalAiLogs: number;
    dbTableCount: number;
  };
}

function ConfigRow({
  label,
  value,
  description,
  isOk,
}: {
  label: string;
  value: string;
  description?: string;
  isOk?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-neutral-800/60 last:border-0">
      <div>
        <div className="text-sm font-medium text-neutral-200">{label}</div>
        {description && <div className="text-xs text-neutral-500 mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {isOk !== undefined && (
          isOk
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
        <span className={`text-sm font-mono ${isOk === false ? "text-amber-400" : "text-neutral-300"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function SystemSettingsClient({ providerSettings, envInfo, systemStats }: Props) {
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle");

  const handleSaveProviderSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation this would POST to /api/admin/system-config
      await new Promise((r) => setTimeout(r, 800));
      setSaveStatus("ok");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Cài Đặt Hệ Thống
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Cấu hình runtime, trạng thái môi trường và tham số AI
          </p>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 rounded-lg hover:border-neutral-600 hover:text-neutral-200 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Supabase Dashboard
        </a>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Users", value: systemStats.totalUsers, icon: Shield, color: "text-blue-400" },
          { label: "AI Jobs", value: systemStats.totalJobs, icon: Zap, color: "text-amber-400" },
          { label: "Vocab Items", value: systemStats.totalVocab.toLocaleString(), icon: Database, color: "text-emerald-400" },
          { label: "AI Log Rows", value: systemStats.totalAiLogs.toLocaleString(), icon: Clock, color: "text-indigo-400" },
          { label: "DB Tables", value: systemStats.dbTableCount, icon: Server, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-neutral-500">{label}</div>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <div className="text-xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Environment Config */}
      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <h3 className="text-sm font-medium text-neutral-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-neutral-400" />
            Môi Trường Runtime
          </h3>
        </div>
        <div className="px-5 py-2">
          <ConfigRow
            label="NODE_ENV"
            value={envInfo.nodeEnv}
            description="Môi trường Node.js hiện tại"
            isOk={envInfo.nodeEnv === "production"}
          />
          <ConfigRow
            label="Supabase Project"
            value={envInfo.supabaseUrl.replace("https://", "").split(".")[0] + ".supabase.co"}
            description="Project Supabase đang kết nối"
            isOk
          />
          <ConfigRow
            label="SHADOWING_PROVIDER"
            value={envInfo.shadowingProvider || "kiraai (default)"}
            description="Provider AI xử lý Shadowing"
            isOk
          />
          <ConfigRow
            label="VOCAB_PROVIDER"
            value={envInfo.vocabProvider || "hhtech (default)"}
            description="Provider AI trích xuất từ vựng"
            isOk
          />
          <ConfigRow
            label="GRAMMAR_PROVIDER"
            value={envInfo.grammarProvider || "hhtech (default)"}
            description="Provider AI trích xuất ngữ pháp"
            isOk
          />
        </div>
      </div>

      {/* AI Provider Status */}
      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <h3 className="text-sm font-medium text-neutral-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Trạng Thái AI Providers
          </h3>
        </div>
        <div className="px-5 py-2">
          <ConfigRow
            label="KiraAI"
            value={envInfo.kiraModelConfigured ? "Đã cấu hình" : "Chưa cấu hình"}
            description="KIRAAI_API_KEY + KIRAAI_BASE_URL"
            isOk={envInfo.kiraModelConfigured}
          />
          <ConfigRow
            label="HHTECH"
            value={envInfo.hhtechConfigured ? "Đã cấu hình" : "Chưa cấu hình"}
            description="HHTECH_API_KEY + HHTECH_BASE_URL"
            isOk={envInfo.hhtechConfigured}
          />
          <ConfigRow
            label="Anthropic"
            value={envInfo.anthropicConfigured ? "Đã cấu hình" : "Không sử dụng"}
            description="ANTHROPIC_API_KEY (optional)"
            isOk={envInfo.anthropicConfigured}
          />
        </div>
      </div>

      {/* DB Provider Settings */}
      {providerSettings.length > 0 && (
        <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Provider Settings (DB)
            </h3>
            <span className="text-xs text-neutral-500">{providerSettings.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-neutral-400">
              <thead className="text-xs text-neutral-500 uppercase tracking-wider border-b border-neutral-800/60 bg-neutral-900/20">
                <tr>
                  <th className="px-5 py-3 font-medium">Key</th>
                  <th className="px-5 py-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {providerSettings.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-900/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-neutral-300 whitespace-nowrap">{s.key}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500 truncate max-w-[400px]">
                      {typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
        <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-400 leading-relaxed">
          Cấu hình runtime (API keys, URLs) được quản lý qua biến môi trường <code className="text-indigo-300">.env</code>.{" "}
          Để thay đổi cài đặt provider động, sử dụng bảng <code className="text-indigo-300">provider_settings</code> trong Supabase.
          Các giá trị trong bảng này sẽ ghi đè biến môi trường khi được implement trong provider.
        </p>
      </div>
    </div>
  );
}
