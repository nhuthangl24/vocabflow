require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: job } = await supabase.from('transcript_jobs').select('*').order('created_at', { ascending: false }).limit(1).single();
  if (!job) {
    console.log("No job");
    return;
  }
  console.log("Processing job:", job.id);
  
  // Call the API endpoint
  const res = await fetch(`http://localhost:3000/api/webhooks/transcription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ jobId: job.id }),
  });
  
  const text = await res.text();
  console.log("Response:", res.status, text);
}
test();
