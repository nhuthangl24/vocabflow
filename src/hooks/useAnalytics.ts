"use client";

import { useEffect, useRef, useCallback } from "react";

type FrontendEvent = {
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  metadata?: Record<string, any>;
};

// Global queue for batching
let eventQueue: FrontendEvent[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000; // 5 seconds

// Helper to flush the queue
const flushQueue = async () => {
  if (eventQueue.length === 0) return;
  const eventsToSend = [...eventQueue];
  eventQueue = []; // Clear queue immediately
  
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: eventsToSend }),
      // keepalive ensures the request fires even if page is unloading
      keepalive: true,
    });
  } catch (error) {
    console.error("Analytics flush error:", error);
    // Put them back if it failed, but be careful of infinite growth
    if (eventQueue.length < 500) {
      eventQueue = [...eventsToSend, ...eventQueue];
    }
  }
};

// Add beacon flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushQueue();
    }
  });
}

export function useAnalytics(baseCategory?: string) {
  
  const trackEvent = useCallback((action: string, label?: string, value?: number, metadata?: Record<string, any>, categoryOverride?: string) => {
    const event: FrontendEvent = {
      event_category: categoryOverride || baseCategory || "General",
      event_action: action,
      event_label: label,
      event_value: value,
      metadata
    };

    eventQueue.push(event);

    if (eventQueue.length >= BATCH_SIZE) {
      if (batchTimeout) clearTimeout(batchTimeout);
      flushQueue();
    } else {
      if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          flushQueue();
          batchTimeout = null;
        }, FLUSH_INTERVAL);
      }
    }
  }, [baseCategory]);

  return { trackEvent };
}
