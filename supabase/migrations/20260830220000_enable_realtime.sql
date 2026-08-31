-- Enable realtime for core tables so the admin dashboard can subscribe to them
alter publication supabase_realtime add table transcript_jobs;
alter publication supabase_realtime add table ai_api_logs;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table user_events;
