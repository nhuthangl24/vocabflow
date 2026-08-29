import { NextRequest, NextResponse } from "next/server";
import { trackUserEventsBatch, UserEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let events: UserEvent[] = body.events;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: "No events provided" }, { status: 400 });
    }

    // Try to get authenticated user to ensure accurate user_id
    // But don't fail if not logged in (anonymous events)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Map IP and user agent metadata
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    events = events.map(event => ({
      ...event,
      user_id: user?.id || event.user_id || null, // Prioritize server-verified user_id
      metadata: {
        ...event.metadata,
        ip,
        user_agent: userAgent,
        // Don't log full IP if privacy is a concern, but for standard analytics it's typical.
      }
    }));

    // Fire and forget - don't block response
    trackUserEventsBatch(events).catch(console.error);

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error("API Track Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
