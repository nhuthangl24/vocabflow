const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uduaqyvqxvyfiwwpbouz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWFxeXZxeHZ5Zml3d3Bib3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTQzODcsImV4cCI6MjEwMzI5MDM4N30.k_mB6ox4iXi8cdOOsigUuTCiLAZEnJWicB74mu9WvPs'
);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_signup_45@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

testSignup();
