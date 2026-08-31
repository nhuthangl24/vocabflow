const fs = require('fs');
const path = require('path');

const routes = [
  { path: 'realtime', title: 'Realtime Metrics' },
  { path: 'payments', title: 'Payments & Revenue' },
  { path: 'media', title: 'Media Assets' },
  { path: 'shadowing', title: 'Shadowing Engine' },
  { path: 'srs', title: 'FSRS & Vocabulary' },
  { path: 'grammar', title: 'Grammar Engine' },
  { path: 'providers', title: 'AI Providers' },
  { path: 'workers', title: 'Workers & Queues' },
  { path: 'database', title: 'Database Health' },
  { path: 'logs', title: 'Security Logs' }
];

const template = (title) => `import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
        <Construction className="w-8 h-8 text-indigo-500" />
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight mb-3">${title}</h2>
      <p className="text-neutral-400 text-sm leading-relaxed max-w-md">
        This module is currently being upgraded as part of the Lumina Enterprise Evolution. 
        The new Linear-style interface will be available in the next deployment phase.
      </p>
      
      <div className="mt-8 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs text-left w-full">
        <div className="font-semibold mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Module Status: In Development
        </div>
        <ul className="list-disc list-inside space-y-1 ml-1 text-indigo-400/80">
          <li>Migrating legacy data to new schema</li>
          <li>Optimizing database indexes</li>
          <li>Rebuilding UI with Vercel/Linear tokens</li>
        </ul>
      </div>
    </div>
  );
}
`;

routes.forEach(route => {
  const dirPath = path.join(__dirname, 'src/app/admin', route.path);
  const filePath = path.join(dirPath, 'page.tsx');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(filePath, template(route.title));
  console.log(`Created ${filePath}`);
});
