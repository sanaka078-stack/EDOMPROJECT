import { useEffect, useRef } from "react";

interface TabNotificationOptions {
  unreadCount: number;
  baseTitle?: string;
}

export function useTabNotifications({ unreadCount, baseTitle = "মেসেজ ও সাপোর্ট" }: TabNotificationOptions) {
  const originalTitleRef = useRef<string>(document.title);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Store the original title on first mount
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (unreadCount > 0) {
      let isFlashing = false;
      
      // Flash the title with unread count
      const updateTitle = () => {
        if (document.hidden) {
          document.title = isFlashing 
            ? `(${unreadCount}) ${baseTitle}` 
            : `🔔 নতুন মেসেজ!`;
          isFlashing = !isFlashing;
        } else {
          document.title = `(${unreadCount}) ${baseTitle}`;
        }
      };

      updateTitle();
      intervalRef.current = setInterval(updateTitle, 1500);
    } else {
      document.title = baseTitle;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [unreadCount, baseTitle]);

  // Reset title when component unmounts
  useEffect(() => {
    return () => {
      document.title = originalTitleRef.current || "মেসেজ ও সাপোর্ট";
    };
  }, []);
}
