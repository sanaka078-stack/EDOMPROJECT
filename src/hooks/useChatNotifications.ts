import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationData {
  title: string;
  body: string;
  tag?: string;
}

export function useChatNotifications() {
  const permissionRef = useRef<NotificationPermission>("default");
  const audioContextRef = useRef<AudioContext | null>(null);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
      return permission === "granted";
    }

    return false;
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      // Only show if page is not focused
      if (document.hidden) {
        const notification = new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Focus window on click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      }
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume audio context if suspended
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  }, []);

  // Notify for new message
  const notifyNewMessage = useCallback((data: NotificationData) => {
    // Play sound
    playNotificationSound();
    
    // Show browser notification
    showNotification(data.title, {
      body: data.body,
      tag: data.tag || "new-message",
    });
  }, [playNotificationSound, showNotification]);

  // Subscribe to realtime changes and notify
  const subscribeToNotifications = useCallback((onNewMessage?: (data: NotificationData) => void) => {
    // Subscribe to live chat messages
    const liveChatChannel = supabase
      .channel("chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
        },
        (payload) => {
          const message = payload.new as { content: string; sender: string; sender_name?: string };
          if (message.sender === "customer") {
            const notificationData = {
              title: "নতুন চ্যাট মেসেজ",
              body: message.content.substring(0, 100),
              tag: "live-chat",
            };
            notifyNewMessage(notificationData);
            onNewMessage?.(notificationData);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_tickets",
        },
        (payload) => {
          const ticket = payload.new as { subject: string; customer_name: string };
          const notificationData = {
            title: "নতুন সাপোর্ট টিকেট",
            body: `${ticket.customer_name}: ${ticket.subject}`,
            tag: "support-ticket",
          };
          notifyNewMessage(notificationData);
          onNewMessage?.(notificationData);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_messages",
        },
        (payload) => {
          const message = payload.new as { first_name: string; last_name: string; message: string };
          const notificationData = {
            title: "নতুন কন্টাক্ট মেসেজ",
            body: `${message.first_name} ${message.last_name}: ${message.message.substring(0, 80)}`,
            tag: "contact-message",
          };
          notifyNewMessage(notificationData);
          onNewMessage?.(notificationData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(liveChatChannel);
    };
  }, [notifyNewMessage]);

  // Initialize permission check
  useEffect(() => {
    if ("Notification" in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  return {
    requestPermission,
    showNotification,
    playNotificationSound,
    notifyNewMessage,
    subscribeToNotifications,
    isSupported: "Notification" in window,
  };
}
