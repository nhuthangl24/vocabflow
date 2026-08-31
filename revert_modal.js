const fs = require('fs');
const file = '/Users/nhuthang/Desktop/vocabflow/src/app/admin/providers/ProvidersClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove selectedModel state
content = content.replace(
  `  const [lastRefresh, setLastRefresh] = useState(new Date());\n  const [selectedModel, setSelectedModel] = useState<ModelMetrics | null>(null);`,
  `  const [lastRefresh, setLastRefresh] = useState(new Date());`
);

// 2. Remove the modal HTML
const modalStart = `{/* Model Detail Modal */}`;
const modalEnd = `{/* ── Tabs ── */}`;
const startIdx = content.indexOf(modalStart);
const endIdx = content.indexOf(modalEnd);
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
}

// 3. Revert ModelBreakdownTable props
content = content.replace(
  `function ModelBreakdownTable({ models, providers, onSelectModel }: { models: ModelMetrics[]; providers: ProviderConfig[]; onSelectModel?: (m: ModelMetrics) => void }) {`,
  `function ModelBreakdownTable({ models, providers }: { models: ModelMetrics[]; providers: ProviderConfig[] }) {`
);

content = content.replace(
  `<tr key={i} onClick={() => onSelectModel?.(m)} className="hover:bg-neutral-900/40 transition-colors cursor-pointer">`,
  `<tr key={i} className="hover:bg-neutral-900/20 transition-colors">`
);

content = content.replace(
  `<ModelBreakdownTable models={modelMetrics} providers={providers} onSelectModel={setSelectedModel} />`,
  `<ModelBreakdownTable models={modelMetrics} providers={providers} />`
);

// 4. Revert ProviderCard props and onClick
content = content.replace(
  `function ProviderCard({ prov, metrics, pingStatus, onSelect }: { prov: ProviderConfig; metrics?: ProviderMetrics; pingStatus?: PingResult; onSelect?: () => void }) {`,
  `function ProviderCard({ prov, metrics, pingStatus }: { prov: ProviderConfig; metrics?: ProviderMetrics; pingStatus?: PingResult }) {`
);

content = content.replace(
  `    <div onClick={onSelect} className={\`relative rounded-xl border \${borderColor} bg-[#0a0a0a] overflow-hidden transition-all duration-300 hover:border-neutral-700 cursor-pointer\`}>`,
  `    <div className={\`relative rounded-xl border \${borderColor} bg-[#0a0a0a] overflow-hidden transition-all duration-300 hover:border-neutral-700\`}>`
);

content = content.replace(
  /<ProviderCard key=\{prov\.key\} prov=\{prov\} metrics=\{providerMetrics\[prov\.key\]\} pingStatus=\{pingResults\[prov\.key\]\} onSelect=\{[^}]+\} \/>/g,
  `<ProviderCard key={prov.key} prov={prov} metrics={providerMetrics[prov.key]} pingStatus={pingResults[prov.key]} />`
);

fs.writeFileSync(file, content);
