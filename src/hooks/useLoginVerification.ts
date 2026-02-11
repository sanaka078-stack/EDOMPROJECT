import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  isMobile: boolean;
}

interface VerificationState {
  isBlocked: boolean;
  verificationToken: string | null;
  reason: string;
  email: string;
}

export function useLoginVerification() {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isBlocked: false,
    verificationToken: null,
    reason: '',
    email: '',
  });
  const [checking, setChecking] = useState(false);

  // Detect device info from user agent
  const getDeviceInfo = useCallback((): DeviceInfo => {
    const ua = navigator.userAgent;
    
    // Detect browser
    let browser = 'Unknown Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Detect device type
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
    let device = isMobile ? 'Mobile' : 'Desktop';
    if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet';

    return { browser, os, device, isMobile };
  }, []);

  // Check if login should be blocked
  const checkLoginSecurity = useCallback(async (userId: string, email: string): Promise<boolean> => {
    setChecking(true);
    try {
      const deviceInfo = getDeviceInfo();

      const { data, error } = await supabase.functions.invoke('verify-login', {
        body: {
          action: 'check',
          userId,
          email,
          deviceInfo,
        },
      });

      if (error) {
        console.error('Login security check error:', error);
        // On error, allow login (fail-open for better UX)
        return false;
      }

      if (data.blocked) {
        setVerificationState({
          isBlocked: true,
          verificationToken: data.verificationToken,
          reason: data.reason,
          email: email,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login security check failed:', error);
      return false;
    } finally {
      setChecking(false);
    }
  }, [getDeviceInfo]);

  // Reset verification state
  const resetVerification = useCallback(() => {
    setVerificationState({
      isBlocked: false,
      verificationToken: null,
      reason: '',
      email: '',
    });
  }, []);

  return {
    verificationState,
    checking,
    checkLoginSecurity,
    resetVerification,
    getDeviceInfo,
  };
}
