import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track page view in GA4 (dynamically uses loaded config)
const trackGA4PageView = (path: string, title?: string) => {
  if (typeof window.gtag === 'function') {
    // gtag will use the config already set by GA4Provider
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

// Track custom event in GA4
const trackGA4Event = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};

export function usePageViewTracking() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    const trackPageView = async () => {
      // Avoid tracking the same page twice in a row
      const currentPath = location.pathname + location.search;
      if (currentPath === lastTrackedPath.current) return;
      lastTrackedPath.current = currentPath;

      // Track in GA4
      trackGA4PageView(currentPath);

      // Track in internal analytics
      try {
        const sessionId = getSessionId();
        const referrer = document.referrer || null;
        
        // Get user ID if logged in
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('analytics_events' as any).insert({
          event_type: 'page_view',
          page_url: window.location.href,
          referrer: referrer,
          session_id: sessionId,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          event_data: {
            pathname: location.pathname,
            search: location.search,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        // Silent fail - don't break the app for analytics
        console.debug('Analytics tracking error:', error);
      }
    };

    trackPageView();
  }, [location.pathname, location.search]);
}

// Track custom events (both GA4 + Internal)
export async function trackEvent(eventType: string, eventData?: Record<string, any>) {
  // Track in GA4
  trackGA4Event(eventType, eventData);

  // Track in internal analytics
  try {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('analytics_events' as any).insert({
      event_type: eventType,
      page_url: window.location.href,
      referrer: document.referrer || null,
      session_id: sessionId,
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
      event_data: eventData || {},
    });
  } catch (error) {
    console.debug('Analytics tracking error:', error);
  }
}

// Export GA4 helpers for direct use
export { trackGA4Event, trackGA4PageView };
