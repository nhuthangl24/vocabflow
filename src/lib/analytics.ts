import { createClient } from "@supabase/supabase-js";

// Initialize a dedicated Supabase client for analytics (using service role to bypass RLS for backend inserts)
// If running on client, this will not have service role, so it relies on anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export type UserEvent = {
  user_id?: string | null;
  session_id?: string;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  metadata?: Record<string, any>;
};

export type AILogEvent = {
  user_id?: string | null;
  job_id?: string;
  provider: string;
  model: string;
  task_type: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  latency_ms?: number;
  status: 'success' | 'error' | 'retry';
  error_message?: string;
  raw_prompt?: string;
  raw_response?: string;
};

/**
 * Log a user event to the database.
 * Designed to be non-blocking. Will not throw errors.
 */
export async function trackUserEvent(event: UserEvent) {
  try {
    // Fire and forget
    supabase.from('user_events').insert([event]).then(({ error }) => {
      if (error) console.error("Error tracking user event:", error);
    });
  } catch (e) {
    console.error("Failed to track user event", e);
  }
}

/**
 * Log an AI API usage event to the database.
 * Designed to be non-blocking. Will not throw errors.
 */
export async function trackAILog(log: AILogEvent) {
  try {
    // Fire and forget
    supabase.from('ai_api_logs').insert([log]).then(({ error }) => {
      if (error) console.error("Error tracking AI log:", error);
    });
  } catch (e) {
    console.error("Failed to track AI log", e);
  }
}

/**
 * Batch insert events (used by the /api/track endpoint)
 */
export async function trackUserEventsBatch(events: UserEvent[]) {
  if (!events || events.length === 0) return;
  try {
    const { error } = await supabase.from('user_events').insert(events);
    if (error) console.error("Error tracking batch user events:", error);
  } catch (e) {
    console.error("Failed to track batch user events", e);
  }
}
