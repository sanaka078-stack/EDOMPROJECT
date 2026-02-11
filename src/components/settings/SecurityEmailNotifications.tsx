import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Shield, ShieldCheck, ShieldX, Mail, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function SecurityEmailNotifications() {
  const [loading, setLoading] = useState(true);
  const [emailSettings, setEmailSettings] = useState({
    loginAlertEnabled: true,
    suspiciousLoginEnabled: true,
    newDeviceAlertEnabled: true,
    weeklySecurityDigestEnabled: false,
  });

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('key', 'email_notifications')
        .single();

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          setEmailSettings(prev => ({
            ...prev,
            ...parsed,
          }));
        } catch (e) {
          console.log('Could not parse email settings');
        }
      }
    } catch (error) {
      console.log('Email settings not found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async (newSettings: typeof emailSettings) => {
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          key: 'email_notifications',
          setting_value: JSON.stringify(newSettings),
        } as any, { onConflict: 'key' });

      if (error) throw error;
      
      setEmailSettings(newSettings);
      toast.success('Email notification settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    }
  };

  const toggleNotification = (key: keyof typeof emailSettings) => {
    const newSettings = { ...emailSettings, [key]: !emailSettings[key] };
    saveEmailSettings(newSettings);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          Security Email Notifications
        </CardTitle>
        <CardDescription>
          Configure which security-related emails should be sent to users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Login Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Send email notification for every successful login
                </p>
              </div>
            </div>
            <Switch
              checked={emailSettings.loginAlertEnabled}
              onCheckedChange={() => toggleNotification('loginAlertEnabled')}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldX className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-medium">Suspicious Login Detection</p>
                <p className="text-sm text-muted-foreground">
                  Block and require verification for logins from new devices
                </p>
              </div>
            </div>
            <Switch
              checked={emailSettings.suspiciousLoginEnabled}
              onCheckedChange={() => toggleNotification('suspiciousLoginEnabled')}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Mail className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium">New Device Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Notify users when they login from a new device
                </p>
              </div>
            </div>
            <Switch
              checked={emailSettings.newDeviceAlertEnabled}
              onCheckedChange={() => toggleNotification('newDeviceAlertEnabled')}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Weekly Security Digest</p>
                <p className="text-sm text-muted-foreground">
                  Send weekly summary of security activities
                </p>
              </div>
            </div>
            <Switch
              checked={emailSettings.weeklySecurityDigestEnabled}
              onCheckedChange={() => toggleNotification('weeklySecurityDigestEnabled')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
