const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const dbUrl = "postgresql://postgres.uduaqyvqxvyfiwwpbouz:nhuthangl24's%20Project@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    // Read the report migration
    const sql = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20260831144151_add_subtitle_reports.sql'), 'utf8');
    
    console.log("Executing SQL...");
    await client.query(sql);
    console.log("Success creating tables!");

    // Also reload the schema cache
    console.log("Reloading schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Success reloading schema!");
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
