
fetch('https://uduaqyvqxvyfiwwpbouz.supabase.co/rest/v1/plans?select=daily_video_limit,max_video_duration_minutes,enable_shadowing&name=ilike.FREE', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWFxeXZxeHZ5Zml3d3Bib3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzcxNDM4NywiZXhwIjoyMTAzMjkwMzg3fQ.4yBBMiENFdjt6lcgqEbs0B1umKs9O9dzf3F7fJ2cSnM'
  }
}).then(res => res.json()).then(console.log).catch(console.error);

