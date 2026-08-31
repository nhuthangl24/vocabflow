-- Migration: System Status & Health Monitoring
-- Description: Creates tables for monitoring system health, ping logs, and incident management.

-- 1. system_services (Danh sách các service cần theo dõi)
CREATE TABLE IF NOT EXISTS system_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('frontend', 'api', 'database', 'auth', 'storage', 'queue', 'worker', 'ai_provider', 'external')),
  description text,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance')),
  last_check_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bảng mặc định
INSERT INTO system_services (name, type, description) VALUES
  ('Lumina Web', 'frontend', 'Next.js App Router / Edge'),
  ('Core API', 'api', 'Backend API Endpoints'),
  ('Supabase Database', 'database', 'PostgreSQL Primary Database'),
  ('Supabase Auth', 'auth', 'Authentication Service'),
  ('Supabase Storage', 'storage', 'Object Storage (Media)'),
  ('Task Queue', 'queue', 'Background Job Queue'),
  ('Media Workers', 'worker', 'FFmpeg / yt-dlp Processors'),
  ('HHTECH AI', 'ai_provider', 'Primary AI Provider'),
  ('KiraAI', 'ai_provider', 'Secondary AI Provider'),
  ('OpenAI', 'ai_provider', 'Fallback AI Provider'),
  ('Groq', 'ai_provider', 'Fast AI Provider')
ON CONFLICT DO NOTHING;

-- 2. health_checks (Lịch sử check ping, latency)
CREATE TABLE IF NOT EXISTS health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES system_services(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
  latency_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optimize queries for uptime checks
CREATE INDEX IF NOT EXISTS idx_health_checks_service_id ON health_checks(service_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at);

-- 3. incidents (Quản lý sự cố)
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'outage')),
  status text NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  root_cause text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. incident_services (Nhiều service liên đới 1 incident)
CREATE TABLE IF NOT EXISTS incident_services (
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  service_id uuid REFERENCES system_services(id) ON DELETE CASCADE,
  PRIMARY KEY (incident_id, service_id)
);

-- 5. incident_updates (Dòng thời gian của sự cố)
CREATE TABLE IF NOT EXISTS incident_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note: Cron jobs for automated health checks can be setup using pg_cron 
-- and pg_net. Because this requires cloud extensions, the actual execution 
-- is configured via Supabase Dashboard. 
-- 
-- Example Setup:
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('invoke_health_check', '* * * * *', 
--   $$
--   SELECT net.http_post(
--       url:='https://your-domain.com/api/admin/health-check',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
--   );
--   $$
-- );
