import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 60; // Highly cached

export async function GET() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  try {
    // 1. Fetch active incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .neq('status', 'resolved')
      .order('started_at', { ascending: false });

    // 2. Fetch maintenance
    const { data: maintenance } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .in('status', ['upcoming', 'ongoing'])
      .order('start_time', { ascending: true });

    // 3. Fetch services
    const { data: services } = await supabase
      .from('system_services')
      .select('id, name, type, status, last_check_at')
      .order('type', { ascending: true });

    // 4. Fetch 90-day daily metrics for Timeline
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const { data: metrics } = await supabase
      .from('status_metrics_daily')
      .select('date, service_id, successful_checks, total_checks, avg_latency_ms')
      .gte('date', ninetyDaysAgo);

    return NextResponse.json({
      success: true,
      incidents: incidents || [],
      maintenance: maintenance || [],
      services: services || [],
      metrics: metrics || [],
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
