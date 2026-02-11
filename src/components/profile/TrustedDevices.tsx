import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Loader2, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Shield,
  ShieldCheck,
  ShieldX,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TrustedDevice {
  id: string;
  session_token: string;
  device_info: any;
  user_agent: string | null;
  ip_address: string | null;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  is_current: boolean;
}

export function TrustedDevices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const SESSION_TOKEN_KEY = 'ekta_session_token';

  const getCurrentSessionToken = useCallback(() => {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }, []);

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';
    
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) { os = 'Android'; device = 'Mobile'; }
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) { os = 'iOS'; device = 'Mobile'; }
    else if (userAgent.includes('iPad')) { os = 'iOS'; device = 'Tablet'; }
    
    return { browser, os, device };
  };

  const fetchDevices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      const currentToken = getCurrentSessionToken();
      const devicesWithCurrent: TrustedDevice[] = (data || []).map((session: any) => ({
        id: session.id,
        session_token: session.session_token,
        device_info: session.device_info,
        user_agent: session.user_agent,
        ip_address: session.ip_address,
        is_active: session.is_active,
        last_activity_at: session.last_activity_at,
        created_at: session.created_at,
        is_current: session.session_token === currentToken,
      }));

      setDevices(devicesWithCurrent);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getCurrentSessionToken]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const toggleDeviceActive = async (deviceId: string, currentlyActive: boolean) => {
    setUpdatingId(deviceId);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: !currentlyActive } as any)
        .eq('id', deviceId);

      if (error) throw error;

      await fetchDevices();
      toast({
        title: currentlyActive ? 'Device Deactivated' : 'Device Activated',
        description: currentlyActive 
          ? 'This device session has been deactivated.'
          : 'This device session is now active.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const removeDevice = async (deviceId: string) => {
    setRemovingId(deviceId);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      await fetchDevices();
      toast({
        title: 'Device Removed',
        description: 'The device has been logged out and removed.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Removal Failed',
        description: error.message,
      });
    } finally {
      setRemovingId(null);
    }
  };

  const getDeviceIcon = (device: TrustedDevice) => {
    const { device: deviceType } = parseUserAgent(device.user_agent);
    if (deviceType === 'Mobile') return <Smartphone className="h-5 w-5" />;
    if (deviceType === 'Tablet') return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceDescription = (device: TrustedDevice) => {
    if (device.device_info?.browser && device.device_info?.os) {
      return `${device.device_info.browser} on ${device.device_info.os}`;
    }
    const { browser, os } = parseUserAgent(device.user_agent);
    return `${browser} on ${os}`;
  };

  const activeDevicesCount = devices.filter(d => d.is_active).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Active Devices
              <Badge variant="secondary" className="ml-2">
                {activeDevicesCount} active
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage your active device sessions.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No devices found.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  device.is_current 
                    ? 'border-primary bg-primary/5' 
                    : device.is_active 
                      ? 'border-accent bg-accent/50' 
                      : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    device.is_current 
                      ? 'bg-primary/10 text-primary' 
                      : device.is_active 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {getDeviceIcon(device)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">
                        {getDeviceDescription(device)}
                      </p>
                      {device.is_current && (
                        <Badge variant="default" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          This Device
                        </Badge>
                      )}
                      {device.is_active && !device.is_current && (
                        <Badge variant="secondary" className="text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {!device.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <ShieldX className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {device.is_current 
                          ? 'Active now'
                          : `Last active ${formatDistanceToNow(new Date(device.last_activity_at), { addSuffix: true })}`
                        }
                      </span>
                      <span className="text-xs">
                        • Added {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {!device.is_current && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={device.is_active}
                          onCheckedChange={() => toggleDeviceActive(device.id, device.is_active)}
                          disabled={updatingId === device.id}
                        />
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={removingId === device.id}
                          >
                            {removingId === device.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this device?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will log out the session on {getDeviceDescription(device)} and remove it from your trusted devices. 
                              The user will need to sign in again and verify on that device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeDevice(device.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove device
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Tip:</span> You can deactivate sessions from devices you no longer use. Deactivated sessions will need to sign in again.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
