import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  isMobile: boolean;
}

interface UserSession {
  id: string;
  session_token: string;
  user_agent: string | null;
  ip_address: string | null;
  device_info: any;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  expires_at: string | null;
  is_current: boolean;
}

const SESSION_TOKEN_KEY = 'ekta_session_token';

export function useSessionManagement() {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get or create session token
  const getSessionToken = useCallback(() => {
    let token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    }
    return token;
  }, []);

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

  // Send login alert email
  const sendLoginAlert = useCallback(async (isNewDevice: boolean, deviceInfo: DeviceInfo) => {
    if (!user?.email) return;

    try {
      const response = await supabase.functions.invoke('send-login-alert', {
        body: {
          email: user.email,
          userName: user.user_metadata?.full_name || user.email.split('@')[0],
          deviceInfo,
          loginTime: new Date().toISOString(),
          isNewDevice,
        },
      });

      if (response.error) {
        console.error('Failed to send login alert:', response.error);
      } else {
        console.log('Login alert sent successfully');
        if (isNewDevice) {
          toast.warning('New device login detected! Check your email for details.', {
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error sending login alert:', error);
    }
  }, [user]);

  // Check if this is a new device by comparing device fingerprint
  const isNewDeviceLogin = useCallback((existingSessions: any[], currentDeviceInfo: DeviceInfo): boolean => {
    // Generate a simple fingerprint based on browser + OS
    const currentFingerprint = `${currentDeviceInfo.browser}-${currentDeviceInfo.os}-${currentDeviceInfo.device}`;
    
    // Check if any existing session has the same fingerprint
    for (const session of existingSessions) {
      if (session.user_agent) {
        // Parse user agent to compare
        const ua = session.user_agent;
        let browser = 'Unknown';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        
        let os = 'Unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        
        const sessionFingerprint = `${browser}-${os}-${session.device_name || 'Desktop'}`;
        if (sessionFingerprint === currentFingerprint) {
          return false; // Device already known
        }
      }
    }
    
    return existingSessions.length > 0; // Only flag as new if there are other sessions
  }, []);

  // Register or update current session
  const registerSession = useCallback(async () => {
    if (!user) return;

    const token = getSessionToken();
    setCurrentSessionToken(token);
    const deviceInfo = getDeviceInfo();

    try {
      // First, fetch all existing sessions to check for new device
      const { data: allSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id);

      // Check if session exists
      const { data: existing } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_token', token)
        .maybeSingle();

      if (existing) {
        // Update last active time
        await supabase
          .from('user_sessions')
          .update({ 
            last_activity_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
          } as any)
          .eq('id', existing.id);
      } else {
        // This is a new session - check if it's from a new device
        const isNewDevice = isNewDeviceLogin(allSessions || [], deviceInfo);
        
        // Create new session
        await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            session_token: token,
            user_agent: navigator.userAgent,
            device_info: deviceInfo,
            last_activity_at: new Date().toISOString(),
          } as any);

        // Send email alert for new device login
        if (isNewDevice) {
          console.log('New device detected, sending alert email...');
          await sendLoginAlert(true, deviceInfo);
        } else if ((allSessions || []).length === 0) {
          // First session ever - send welcome/login notification
          console.log('First session, sending login notification...');
          await sendLoginAlert(false, deviceInfo);
        }
      }
    } catch (error) {
      console.error('Error registering session:', error);
    }
  }, [user, getSessionToken, getDeviceInfo, signOut, isNewDeviceLogin, sendLoginAlert]);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      const token = getSessionToken();
      const sessionsWithCurrent: UserSession[] = (data || []).map((session: any) => ({
        id: session.id,
        session_token: session.session_token,
        user_agent: session.user_agent,
        ip_address: session.ip_address,
        device_info: session.device_info,
        is_active: session.is_active,
        last_activity_at: session.last_activity_at,
        created_at: session.created_at,
        expires_at: session.expires_at,
        is_current: session.session_token === token,
      }));

      setSessions(sessionsWithCurrent);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getSessionToken]);

  // Revoke a specific session
  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await fetchSessions();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [fetchSessions]);

  // Revoke all other sessions
  const revokeAllOtherSessions = useCallback(async () => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const token = getSessionToken();
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('session_token', token);

      if (error) throw error;

      await fetchSessions();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user, getSessionToken, fetchSessions]);

  // Delete old sessions (cleanup)
  const cleanupOldSessions = useCallback(async () => {
    if (!user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .lt('last_active_at', thirtyDaysAgo.toISOString());
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }, [user]);

  // Register session and fetch all sessions on mount
  useEffect(() => {
    if (user) {
      registerSession();
      fetchSessions();
      cleanupOldSessions();
    }
  }, [user]);

  // Update last active periodically (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      registerSession();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, registerSession]);

  const activeSessions = sessions;

  return {
    sessions,
    activeSessions,
    currentSessionToken,
    loading,
    revokeSession,
    revokeAllOtherSessions,
    refreshSessions: fetchSessions,
  };
}
