import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Mail, 
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Send,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Settings,
  Globe,
  Lock,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailConfig {
  provider: 'resend' | 'gmail';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  updatedAt: string;
  // Gmail specific
  gmailUser: string;
  gmailAppPassword: string;
}

const DEFAULT_CONFIG: EmailConfig = {
  provider: 'resend',
  apiKey: '',
  fromEmail: '',
  fromName: '',
  isEnabled: false,
  updatedAt: '',
  gmailUser: '',
  gmailAppPassword: '',
};

export function EmailApiConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGmailPassword, setShowGmailPassword] = useState(false);
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('key', 'email_api_config')
        .single();

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          setConfig({
            ...DEFAULT_CONFIG,
            ...parsed,
          });
        } catch (e) {
          console.log('Could not parse email config');
        }
      }
    } catch (error) {
      console.log('Email config not found, using defaults');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = (field: keyof EmailConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (config.provider === 'resend') {
      if (!config.apiKey.trim()) {
        toast.error('অনুগ্রহ করে Resend API Key দিন');
        return;
      }
      if (!config.fromEmail.trim()) {
        toast.error('অনুগ্রহ করে From Email দিন');
        return;
      }
    } else if (config.provider === 'gmail') {
      if (!config.gmailUser.trim()) {
        toast.error('অনুগ্রহ করে Gmail Address দিন');
        return;
      }
      if (!config.gmailAppPassword.trim()) {
        toast.error('অনুগ্রহ করে Gmail App Password দিন');
        return;
      }
    }

    setSaving(true);
    try {
      const configToSave = {
        ...config,
        // For Gmail, set fromEmail to gmailUser if not set
        fromEmail: config.provider === 'gmail' && !config.fromEmail ? config.gmailUser : config.fromEmail,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('store_settings')
        .upsert({
          key: 'email_api_config',
          setting_value: JSON.stringify(configToSave),
        } as any, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Email API configuration সফলভাবে সেভ হয়েছে!');
      setHasChanges(false);
    } catch (error: any) {
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const testEmailService = async () => {
    if (config.provider === 'resend' && !config.apiKey.trim()) {
      toast.error('প্রথমে Resend API Key সেভ করুন');
      return;
    }
    if (config.provider === 'gmail' && (!config.gmailUser.trim() || !config.gmailAppPassword.trim())) {
      toast.error('প্রথমে Gmail credentials সেভ করুন');
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('Please login to test email service');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-login-alert', {
        body: {
          email: user.email,
          userName: user.user_metadata?.full_name || 'User',
          deviceInfo: {
            browser: 'Test Browser',
            os: 'Test OS',
            device: 'Desktop',
            isMobile: false,
          },
          loginTime: new Date().toISOString(),
          isNewDevice: false,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে! ইনবক্স চেক করুন।');
      } else {
        throw new Error(data?.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      toast.error('টেস্ট ইমেইল পাঠাতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = config.provider === 'resend' 
    ? !!config.apiKey 
    : !!(config.gmailUser && config.gmailAppPassword);

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Email API Configuration
            </CardTitle>
            <CardDescription>
              ইমেইল পাঠানোর জন্য Resend বা Gmail configure করুন
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadConfig} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Tabs */}
        <Tabs 
          value={config.provider} 
          onValueChange={(value) => updateConfig('provider', value as 'resend' | 'gmail')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resend" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Resend
            </TabsTrigger>
            <TabsTrigger value="gmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Gmail SMTP
            </TabsTrigger>
          </TabsList>

          {/* Resend Configuration */}
          <TabsContent value="resend" className="space-y-4 mt-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.apiKey ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Resend Email Service</p>
                  <p className="text-sm text-muted-foreground">
                    Modern email API for developers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {config.apiKey ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
                <Switch
                  checked={config.isEnabled && config.provider === 'resend'}
                  onCheckedChange={(checked) => updateConfig('isEnabled', checked)}
                />
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Resend API Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                    value={config.apiKey}
                    onChange={(e) => updateConfig('apiKey', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://resend.com/api-keys', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Get Key
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <a 
                  href="https://resend.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  resend.com/api-keys
                </a> থেকে API key নিন। প্রথমে{' '}
                <a 
                  href="https://resend.com/domains" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  domain verify
                </a> করতে হবে।
              </p>
            </div>

            {/* From Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromEmail" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  From Email
                </Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={config.fromEmail}
                  onChange={(e) => updateConfig('fromEmail', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Verified domain এর email ব্যবহার করুন
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  From Name
                </Label>
                <Input
                  id="fromName"
                  placeholder="Your Store Name"
                  value={config.fromName}
                  onChange={(e) => updateConfig('fromName', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ইমেইলে যে নাম দেখাবে
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Gmail Configuration */}
          <TabsContent value="gmail" className="space-y-4 mt-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.gmailUser && config.gmailAppPassword ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Gmail SMTP</p>
                  <p className="text-sm text-muted-foreground">
                    Google এর SMTP server দিয়ে email পাঠান
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {config.gmailUser && config.gmailAppPassword ? (
                  <Badge variant="default" className="gap-1 bg-red-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
                <Switch
                  checked={config.isEnabled && config.provider === 'gmail'}
                  onCheckedChange={(checked) => updateConfig('isEnabled', checked)}
                />
              </div>
            </div>

            {/* Gmail Credentials */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gmailUser" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Gmail Address
                </Label>
                <Input
                  id="gmailUser"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={config.gmailUser}
                  onChange={(e) => updateConfig('gmailUser', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  যে Gmail account থেকে email পাঠাবেন
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gmailAppPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Gmail App Password
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="gmailAppPassword"
                      type={showGmailPassword ? 'text' : 'password'}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={config.gmailAppPassword}
                      onChange={(e) => updateConfig('gmailAppPassword', e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowGmailPassword(!showGmailPassword)}
                    >
                      {showGmailPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://myaccount.google.com/apppasswords', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Get Password
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google App Passwords
                  </a> থেকে App Password তৈরি করুন। 
                  <strong className="text-foreground"> 2-Step Verification</strong> চালু থাকতে হবে।
                </p>
              </div>

              {/* From Name for Gmail */}
              <div className="space-y-2">
                <Label htmlFor="gmailFromName" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  From Name (Optional)
                </Label>
                <Input
                  id="gmailFromName"
                  placeholder="Your Store Name"
                  value={config.fromName}
                  onChange={(e) => updateConfig('fromName', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ইমেইলে যে নাম দেখাবে (খালি রাখলে Gmail নাম দেখাবে)
                </p>
              </div>
            </div>

            {/* Gmail Warning */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ⚠️ <strong>গুরুত্বপূর্ণ:</strong> Gmail SMTP দিয়ে দিনে সর্বোচ্চ 500 টি email পাঠাতে পারবেন। 
                বেশি email পাঠাতে হলে Resend ব্যবহার করুন।
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Features */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium mb-3">এই configuration দিয়ে যা পাঠাতে পারবেন:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Login Alerts</Badge>
            <Badge variant="outline">Verification Emails</Badge>
            <Badge variant="outline">Security Notifications</Badge>
            <Badge variant="outline">Order Confirmations</Badge>
            <Badge variant="outline">Abandoned Cart Reminders</Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={testEmailService}
            disabled={!isConfigured || testing}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>

        {/* Last Updated */}
        {config.updatedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(config.updatedAt).toLocaleString('bn-BD')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
