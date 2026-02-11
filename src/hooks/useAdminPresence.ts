import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_PRESENCE_CHANNEL = "admin-presence";

interface AdminPresence {
  id: string;
  email: string;
  online_at: string;
}

export function useAdminPresence() {
  const [onlineAdmins, setOnlineAdmins] = useState<AdminPresence[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Track admin presence (call this from admin dashboard)
  const trackPresence = useCallback(async (userId: string, email: string) => {
    if (channelRef.current) return;

    const channel = supabase.channel(ADMIN_PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const admins: AdminPresence[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = (presences as unknown as AdminPresence[])[0];
          if (presence) {
            admins.push({ ...presence, id: key });
          }
        });
        
        setOnlineAdmins(admins);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: userId,
            email,
            online_at: new Date().toISOString(),
          });
          setIsOnline(true);
        }
      });

    channelRef.current = channel;
  }, []);

  // Untrack presence (call when leaving admin)
  const untrackPresence = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsOnline(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    onlineAdmins,
    isOnline,
    trackPresence,
    untrackPresence,
    hasOnlineAdmin: onlineAdmins.length > 0,
  };
}

// Lightweight hook for customers to just check if any admin is online
export function useIsAdminOnline() {
  const [hasOnlineAdmin, setHasOnlineAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const channel = supabase.channel(ADMIN_PRESENCE_CHANNEL);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const adminCount = Object.keys(state).length;
        setHasOnlineAdmin(adminCount > 0);
        setIsChecking(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { hasOnlineAdmin, isChecking };
}
