import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Monitor, Smartphone, Tablet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface LoginActivityItem {
  id: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_info: any;
  location: any;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export function LoginActivity() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activities, setActivities] = useState<LoginActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoginActivity();
    }
  }, [user]);

  const fetchLoginActivity = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities((data || []) as LoginActivityItem[]);
    } catch (error) {
      console.error('Error fetching login activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceType = (activity: LoginActivityItem): string => {
    const deviceInfo = activity.device_info;
    if (deviceInfo?.device) return deviceInfo.device;
    if (activity.user_agent?.includes('Mobile')) return 'Mobile';
    if (activity.user_agent?.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const isSuccessful = (activity: LoginActivityItem): boolean => {
    return activity.status === 'success';
  };

  const getDeviceIcon = (activity: LoginActivityItem) => {
    const deviceType = getDeviceType(activity).toLowerCase();
    if (deviceType.includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (deviceType.includes('tablet')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return { browser, os };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Login Activity
        </CardTitle>
        <CardDescription>
          Recent login attempts and activity on your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No login activity recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => {
                const { browser, os } = parseUserAgent(activity.user_agent);
                const successful = isSuccessful(activity);
                const deviceType = getDeviceType(activity);
                const locationStr = typeof activity.location === 'object' && activity.location 
                  ? activity.location.city || activity.location.country || '' 
                  : '';
                return (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-4 p-3 rounded-lg border ${
                      successful
                        ? 'bg-background hover:bg-muted/50'
                        : 'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        successful
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      {successful ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {successful ? 'Successful login' : 'Failed login attempt'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {deviceType}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        {getDeviceIcon(activity)}
                        <span>
                          {browser} on {os}
                        </span>
                      </div>

                      {activity.ip_address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {activity.ip_address.toString()}
                          {locationStr && ` • ${locationStr}`}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        <span className="mx-1">•</span>
                        {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
