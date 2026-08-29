import { NextResponse } from 'next/server';
import os from 'os';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    // 1. Hardware Metrics (OS level)
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    // Approximation of CPU usage (1 min load / num cores * 100)
    // Capped at 100% just in case of spikes
    const cpuUsage = Math.min(100, Math.max(0, Math.round((loadAvg[0] / cpus.length) * 100)));
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsage = Math.round((usedMem / totalMem) * 100);

    const hardware = {
      cpuUsage: isNaN(cpuUsage) ? 0 : cpuUsage,
      ramUsage: isNaN(ramUsage) ? 0 : ramUsage,
      uptime: os.uptime(),
    };

    // 2. Database Status
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('transcript_jobs').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;
    const dbStatus = dbError ? 'Offline' : 'Online';

    // 3. Queue / Worker Metrics (transcript_jobs)
    const { data: queueData, error: queueError } = await supabase
      .from('transcript_jobs')
      .select('status');
      
    const queue = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    if (queueData) {
      queueData.forEach(job => {
        if (job.status === 'pending') queue.pending++;
        if (job.status === 'processing') queue.processing++;
        if (job.status === 'completed') queue.completed++;
        if (job.status === 'failed') queue.failed++;
      });
    }

    // 4. AI Providers Metrics (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: aiLogs } = await supabase
      .from('ai_api_logs')
      .select('provider, status_code, processing_time_ms')
      .gte('created_at', oneDayAgo);

    const ai_providers = {
      HHTECH: { calls: 0, errors: 0, totalTime: 0, avgTime: 0, errorRate: 0 },
      KIRA: { calls: 0, errors: 0, totalTime: 0, avgTime: 0, errorRate: 0 },
    };

    if (aiLogs) {
      aiLogs.forEach(log => {
        const p = log.provider === 'HHTECH_ANTHROPIC' ? 'HHTECH' : (log.provider?.toUpperCase() || 'UNKNOWN');
        if (p === 'HHTECH' || p === 'KIRAAI' || p === 'KIRA') {
          const key = p === 'KIRAAI' ? 'KIRA' : p;
          ai_providers[key as 'HHTECH'|'KIRA'].calls++;
          if (log.status_code >= 400) {
            ai_providers[key as 'HHTECH'|'KIRA'].errors++;
          }
          if (log.processing_time_ms) {
            ai_providers[key as 'HHTECH'|'KIRA'].totalTime += log.processing_time_ms;
          }
        }
      });

      ['HHTECH', 'KIRA'].forEach((key) => {
        const stat = ai_providers[key as 'HHTECH'|'KIRA'];
        stat.errorRate = stat.calls > 0 ? (stat.errors / stat.calls) * 100 : 0;
        stat.avgTime = stat.calls > 0 ? stat.totalTime / stat.calls : 0;
      });
    }

    const latency = Date.now() - startTime;

    return NextResponse.json({
      hardware,
      database: { status: dbStatus, latency: dbLatency, error: dbError?.message },
      queue,
      ai_providers,
      latency,
      status: dbStatus === 'Online' ? 'Online' : 'Degraded'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
