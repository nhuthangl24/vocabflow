import { createAdminClient } from '@/lib/supabase/admin';
import { StatusClient } from './StatusClient';

export default async function AdminStatusPage() {
  const supabase = createAdminClient();

  // Fetch initial services
  const { data: services } = await supabase
    .from('system_services')
    .select('*')
    .order('type', { ascending: true });

  // Fetch active incidents
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*, created_by(email)')
    .neq('status', 'resolved')
    .order('started_at', { ascending: false });

  // Fetch recent health checks for 24h uptime calculation (simplified)
  // For production with large data, this should be done via a Postgres view.
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: healthChecks } = await supabase
    .from('health_checks')
    .select('service_id, status')
    .gte('created_at', oneDayAgo);

  const uptime24h: Record<string, number> = {};
  if (healthChecks && services) {
    services.forEach(s => {
      const checks = healthChecks.filter(h => h.service_id === s.id);
      if (checks.length === 0) {
        uptime24h[s.id] = 100;
      } else {
        const up = checks.filter(h => h.status === 'up').length;
        uptime24h[s.id] = (up / checks.length) * 100;
      }
    });
  }

  return (
    <StatusClient 
      initialServices={services || []} 
      activeIncidents={incidents || []} 
      uptime24h={uptime24h}
    />
  );
}
