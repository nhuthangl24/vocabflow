"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export default function PresenceProvider({ userId, email }: { userId: string, email: string }) {
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Create a unique channel for global presence
    const roomOne = supabase.channel('global_presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    roomOne
      .on('presence', { event: 'sync' }, () => {
        // const newState = roomOne.presenceState();
        // We could dispatch this to a global store if needed
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomOne.track({
            user_id: userId,
            email: email,
            online_at: new Date().toISOString(),
            current_path: pathname,
          });
        }
      });

    return () => {
      roomOne.untrack();
      supabase.removeChannel(roomOne);
    };
  }, [userId, email, pathname, supabase]);

  return null;
}
