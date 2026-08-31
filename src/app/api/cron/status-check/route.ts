import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Optional: check Authorization header for cron secret
  const supabase = createAdminClient();
  const startTime = Date.now();

  try {
    // 1. Fetch current services
    const { data: services } = await supabase.from('system_services').select('*');
    if (!services) return NextResponse.json({ success: true, message: 'No services found' });

    // 2. Perform Checks (Simplified mock logic to avoid duplication with health-check API, 
    // but in reality this should call the internal checker)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkRes = await fetch(`${baseUrl}/api/admin/health-check`);
    const healthData = await checkRes.json();

    if (healthData && healthData.services) {
      // For auto incident management
      const { data: activeIncidents } = await supabase
        .from('incidents')
        .select('*')
        .neq('status', 'resolved');

      for (const service of healthData.services) {
        if (service.status === 'down' || service.status === 'major_outage') {
          // Check if there is already an incident
          const hasIncident = activeIncidents?.some(i => i.title.includes(service.name));
          if (!hasIncident) {
            // Create Incident automatically
            await supabase.from('incidents').insert({
              title: `Automatic Alert: ${service.name} is down`,
              severity: 'outage',
              status: 'investigating',
              description: `Automated health check detected ${service.name} is inaccessible. Latency: ${service.latency_ms}ms`,
            });
            // Record live event
            await supabase.from('live_events').insert({
              level: 'critical', service: service.name, message: 'Service down, automated incident created', duration_ms: service.latency_ms
            });
          }
        }
      }
    }

    // 3. Rollup metrics if it's close to midnight (Very naive cron execution)
    const hour = new Date().getUTCHours();
    const min = new Date().getUTCMinutes();
    if (hour === 23 && min > 50) {
       await supabase.rpc('rollup_daily_health_metrics', { target_date: new Date().toISOString().split('T')[0] });
    }

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startTime
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
