const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error, count } = await supabase
    .from("vocabulary_items")
    .select("id, transcript_jobs!inner(media_assets!inner(status))", { count: "exact", head: true })
    .neq("transcript_jobs.media_assets.status", "deleted");
  console.log("Error:", error);
  console.log("Count:", count);
}
run();
