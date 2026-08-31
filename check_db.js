const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { target_table: 'payment_settings' });
  // Wait, I can just query pg_policies
  const { data: policies } = await supabase.from('pg_policies').select('*').eq('tablename', 'payment_settings');
  console.log(policies);
}
check();
