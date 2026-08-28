const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const env = {};
dotenv.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('transcript_jobs').select('id, status, error_message, updated_at, settings').order('created_at', { ascending: false }).limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
