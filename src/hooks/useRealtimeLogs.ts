"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeLogs() {
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    activeWorkers: 0,
    apiRequestsPerMin: 0,
    aiRequestsPerMin: 0,
  });

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial data to seed the UI
    const fetchInitial = async () => {
      const { data: initialAiLogs } = await supabase.from('ai_api_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (initialAiLogs) setApiLogs(initialAiLogs);

      const { data: initialUserEvents } = await supabase.from('user_events').select('*').order('created_at', { ascending: false }).limit(50);
      if (initialUserEvents) setUserEvents(initialUserEvents);
    };

    fetchInitial();

    // Subscribe to new logs
    const logSubscription = supabase
      .channel('admin-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_api_logs' }, (payload) => {
        setApiLogs((current) => [payload.new, ...current].slice(0, 100));
        setMetrics((m) => ({ ...m, aiRequestsPerMin: m.aiRequestsPerMin + 1 }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_events' }, (payload) => {
        setUserEvents((current) => [payload.new, ...current].slice(0, 100));
        setMetrics((m) => ({ ...m, apiRequestsPerMin: m.apiRequestsPerMin + 1 }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logSubscription);
    };
  }, []);

  return { apiLogs, userEvents, metrics };
}
