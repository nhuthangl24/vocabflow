-- Migration: Database Audit Logs
-- Description: Creates the audit_logs table to track changes to sensitive records.

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address text,
    user_agent text,
    changed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying audit history of a specific record
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(changed_at DESC);

-- Example Trigger Function (Generic)
-- Note: You must manually attach this trigger to tables you want to audit.
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, old_data)
        VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;
