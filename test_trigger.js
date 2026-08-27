const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://uduaqyvqxvyfiwwpbouz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWFxeXZxeHZ5Zml3d3Bib3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzcxNDM4NywiZXhwIjoyMTAzMjkwMzg3fQ.4yBBMiENFdjt6lcgqEbs0B1umKs9O9dzf3F7fJ2cSnM'
);
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: `
    DO $$
    BEGIN
      INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test_sql@example.com');
    END $$;
  ` });
  console.log('Result:', data, error);
}
run();
