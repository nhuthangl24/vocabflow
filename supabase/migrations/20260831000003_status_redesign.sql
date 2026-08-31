-- Migration: Production System Status Redesign
-- Description: Adds tables for daily SLA aggregation, scheduled maintenance, and live event logs.

-- 1. Scheduled Maintenance
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link maintenance to specific services
CREATE TABLE IF NOT EXISTS maintenance_services (
    maintenance_id uuid REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
    service_id uuid REFERENCES system_services(id) ON DELETE CASCADE,
    PRIMARY KEY (maintenance_id, service_id)
);

-- 2. Daily Metrics Aggregation (For 365-day SLA timeline)
-- Instead of keeping millions of rows in health_checks, we aggregate them daily per service.
CREATE TABLE IF NOT EXISTS status_metrics_daily (
    date date NOT NULL,
    service_id uuid REFERENCES system_services(id) ON DELETE CASCADE,
    total_checks integer NOT NULL DEFAULT 0,
    successful_checks integer NOT NULL DEFAULT 0,
    failed_checks integer NOT NULL DEFAULT 0,
    degraded_checks integer NOT NULL DEFAULT 0,
    avg_latency_ms integer,
    max_latency_ms integer,
    p95_latency_ms integer,
    PRIMARY KEY (date, service_id)
);

-- 3. Live Event Log (For realtime monitoring in Admin Dashboard)
CREATE TABLE IF NOT EXISTS live_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level text NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'critical')),
    service text NOT NULL,
    message text NOT NULL,
    duration_ms integer,
    trace_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Optimizations
CREATE INDEX IF NOT EXISTS idx_live_events_created_at ON live_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_metrics_daily_date ON status_metrics_daily(date DESC);

-- Example Function to roll up health_checks into daily metrics
-- This can be called by a cron job at the end of each day
CREATE OR REPLACE FUNCTION rollup_daily_health_metrics(target_date date)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO status_metrics_daily (
        date, service_id, total_checks, successful_checks, 
        failed_checks, degraded_checks, avg_latency_ms, max_latency_ms
    )
    SELECT 
        target_date,
        service_id,
        count(*) as total_checks,
        sum(case when status = 'up' then 1 else 0 end) as successful_checks,
        sum(case when status = 'down' then 1 else 0 end) as failed_checks,
        sum(case when status = 'degraded' then 1 else 0 end) as degraded_checks,
        avg(latency_ms)::integer as avg_latency_ms,
        max(latency_ms) as max_latency_ms
    FROM health_checks
    WHERE created_at::date = target_date
    GROUP BY service_id
    ON CONFLICT (date, service_id) DO UPDATE SET
        total_checks = EXCLUDED.total_checks,
        successful_checks = EXCLUDED.successful_checks,
        failed_checks = EXCLUDED.failed_checks,
        degraded_checks = EXCLUDED.degraded_checks,
        avg_latency_ms = EXCLUDED.avg_latency_ms,
        max_latency_ms = EXCLUDED.max_latency_ms;
END;
$$;
