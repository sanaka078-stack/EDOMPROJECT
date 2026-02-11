import { useEffect } from "react";
import { useGA4Config } from "@/hooks/useGA4Config";

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function GA4Provider({ children }: { children: React.ReactNode }) {
  const { measurementId, isEnabled, isLoading } = useGA4Config();

  useEffect(() => {
    if (isLoading) return;

    // Remove any existing GA4 scripts first
    const existingScript = document.getElementById('ga4-dynamic-script');
    const existingInline = document.getElementById('ga4-dynamic-inline');
    if (existingScript) existingScript.remove();
    if (existingInline) existingInline.remove();

    if (isEnabled && measurementId) {
      // Load GA4 script dynamically
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.id = 'ga4-dynamic-script';
      document.head.appendChild(script);

      // Initialize gtag
      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga4-dynamic-inline';
      inlineScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(inlineScript);
    }
  }, [measurementId, isEnabled, isLoading]);

  return <>{children}</>;
}

// Helper to get the current GA4 Measurement ID from settings
export function getGA4MeasurementId(): string | null {
  // Check if gtag is loaded and get the ID from the script
  const script = document.getElementById('ga4-dynamic-script') as HTMLScriptElement;
  if (script?.src) {
    const match = script.src.match(/id=(G-[A-Z0-9]+)/);
    return match ? match[1] : null;
  }
  return null;
}
