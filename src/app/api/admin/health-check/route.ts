import { NextResponse } from 'next/server';
import os from 'os';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  try {
    const results = [];

    // 1. Hardware / Node metrics (Next.js Edge/Server)
    const cpus = os.cpus() || [];
    const loadAvg = os.loadavg ? os.loadavg() : [0,0,0];
    const cpuUsage = cpus.length ? Math.min(100, Math.max(0, Math.round((loadAvg[0] / cpus.length) * 100))) : 0;
    const totalMem = os.totalmem ? os.totalmem() : 0;
    const freeMem = os.freemem ? os.freemem() : 0;
    const ramUsage = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0;

    const systemInfo = {
      cpuUsage,
      ramUsage,
      uptime: os.uptime ? os.uptime() : 0,
      platform: os.platform ? os.platform() : 'unknown',
    };

    // 2. Database Status
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('users').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;
    const dbStatus = dbError ? 'down' : (dbLatency > 1000 ? 'degraded' : 'up');
    results.push({ name: 'Supabase Database', type: 'database', status: dbStatus, latency_ms: dbLatency, error: dbError?.message });

    // 3. Queue Status (from tasks table)
    const qStart = Date.now();
    const { data: queueData, error: qError } = await supabase.from('tasks').select('status');
    const qLatency = Date.now() - qStart;
    
    let pending = 0, failed = 0, running = 0;
    if (queueData) {
      queueData.forEach(job => {
        if (job.status === 'pending') pending++;
        if (job.status === 'processing') running++;
        if (job.status === 'failed') failed++;
      });
    }
    const qStatus = qError ? 'down' : (failed > 50 || pending > 200 ? 'degraded' : 'up');
    results.push({ 
      name: 'Task Queue', type: 'queue', 
      status: qStatus, latency_ms: qLatency, 
      error: qError?.message,
      metrics: { pending, failed, running }
    });

    // 4. Auth Service (Test fetching users)
    const authStart = Date.now();
    const { error: authError } = await supabase.auth.admin.listUsers({ perPage: 1 });
    const authLatency = Date.now() - authStart;
    results.push({ name: 'Supabase Auth', type: 'auth', status: authError ? 'down' : 'up', latency_ms: authLatency, error: authError?.message });

    // 5. Storage Service (List buckets)
    const stStart = Date.now();
    const { error: stError } = await supabase.storage.listBuckets();
    const stLatency = Date.now() - stStart;
    results.push({ name: 'Supabase Storage', type: 'storage', status: stError ? 'down' : 'up', latency_ms: stLatency, error: stError?.message });

    // 6. AI Providers Ping (reuse logic or fetch from our ping API)
    // For now, we will do a quick ping to a known endpoint or just rely on the AI ping route.
    // Instead of duplicating ping logic here, we just summarize from ai_api_logs.
    const aiStart = Date.now();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: aiLogs } = await supabase
      .from('ai_api_logs')
      .select('provider, status')
      .gte('created_at', oneHourAgo);
    
    const ai_providers: Record<string, { total: number; errors: number }> = {
      hhtech: { total: 0, errors: 0 },
      kiraai: { total: 0, errors: 0 },
      openai: { total: 0, errors: 0 },
      groq: { total: 0, errors: 0 }
    };
    
    if (aiLogs) {
      aiLogs.forEach(log => {
        const p = log.provider?.toLowerCase() || 'unknown';
        if (ai_providers[p]) {
          ai_providers[p].total++;
          if (log.status !== 'success') ai_providers[p].errors++;
        }
      });
    }

    Object.keys(ai_providers).forEach(p => {
      const stats = ai_providers[p];
      const errorRate = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0;
      let status = 'up';
      if (errorRate > 30) status = 'down';
      else if (errorRate > 5) status = 'degraded';
      // If 0 requests in last hour, we just assume it's up for now (or 'unknown', but 'up' is safer)
      results.push({ name: p.toUpperCase(), type: 'ai_provider', status, latency_ms: Date.now() - aiStart, metrics: { errorRate, totalRequests: stats.total } });
    });

    // Save checks to database (if triggered by cron)
    // We can infer if it's cron by checking a secret header, but we'll always save for demo.
    try {
      const { data: dbServices } = await supabase.from('system_services').select('id, name');
      if (dbServices && dbServices.length > 0) {
        const insertPayload = results.map(r => {
          // find matching service_id
          const srv = dbServices.find(s => s.name.toLowerCase().includes(r.name.toLowerCase()));
          return srv ? { service_id: srv.id, status: r.status, latency_ms: r.latency_ms, error_message: r.error || null } : null;
        }).filter(Boolean) as any;
        
        if (insertPayload.length > 0) {
          await supabase.from('health_checks').insert(insertPayload);
          // Update last_check_at
          await supabase.from('system_services').update({ last_check_at: new Date().toISOString() }).in('id', insertPayload.map((i: any) => i?.service_id));
        }
      }
    } catch(e) {
      // Ignore DB logging errors if tables don't exist yet
    }

    const totalLatency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      systemInfo,
      services: results,
      totalLatency,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
