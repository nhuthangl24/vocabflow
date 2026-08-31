import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Search, Filter, AlertTriangle } from "lucide-react";

export default async function AdminLogsPage() {
  const adminClient = createAdminClient();

  const { data: eventsRaw } = await adminClient
    .from("user_events")
    .select("*, auth.users(email)")
    .order("created_at", { ascending: false })
    .limit(50);
  const events = eventsRaw as any[];

  const { count: totalEvents } = await adminClient.from("user_events").select("*", { count: 'exact', head: true });
  const suspiciousEvents = events?.filter(e => e.event_category === 'security' || e.event_category === 'error')?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Security & Audit Logs</h2>
          <p className="text-sm text-neutral-400 mt-1">Monitor system events, user actions, and potential threats</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Total Events Logged</div>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-semibold text-white">
            {totalEvents || 0}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Suspicious Events (Recent)</div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-400">
            {suspiciousEvents}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs text-neutral-500 bg-neutral-900/50 uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <th className="px-6 py-4 font-medium">Event ID</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">User / IP</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {events?.map((evt) => (
              <tr key={evt.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-neutral-300 font-mono text-xs">
                  {evt.id?.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    evt.event_category === 'security' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}>
                    {evt.event_category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-white">
                  {evt.event_action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {evt.user_id ? evt.user_id.slice(0,8) + '...' : 'Anonymous'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                  {new Date(evt.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!events || events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No events logged</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
