
fetch('https://uduaqyvqxvyfiwwpbouz.supabase.co/auth/v1/admin/users/4f42c70d-4e2c-4ace-a1d1-c6a2a0871813', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWFxeXZxeHZ5Zml3d3Bib3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzcxNDM4NywiZXhwIjoyMTAzMjkwMzg3fQ.4yBBMiENFdjt6lcgqEbs0B1umKs9O9dzf3F7fJ2cSnM',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWFxeXZxeHZ5Zml3d3Bib3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzcxNDM4NywiZXhwIjoyMTAzMjkwMzg3fQ.4yBBMiENFdjt6lcgqEbs0B1umKs9O9dzf3F7fJ2cSnM'
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data.user_metadata))).catch(console.error);

