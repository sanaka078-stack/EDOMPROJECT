import { useState } from 'react';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  LogOut, 
  Globe,
  Clock,
  Shield,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SessionManagement() {
  const { toast } = useToast();
  const { 
    activeSessions, 
    loading, 
    revokeSession, 
    revokeAllOtherSessions,
    refreshSessions 
  } = useSessionManagement();
  
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    const result = await revokeSession(sessionId);
    
    if (result.success) {
      toast({
        title: 'Session Revoked',
        description: 'The session has been logged out.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Revoke Session',
        description: result.error,
      });
    }
    setRevokingId(null);
  };

  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    const result = await revokeAllOtherSessions();
    
    if (result.success) {
      toast({
        title: 'All Other Sessions Revoked',
        description: 'You have been logged out from all other devices.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Revoke Sessions',
        description: result.error,
      });
    }
    setRevokingAll(false);
  };

  const parseDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return { device: 'Desktop', browser: 'Unknown', os: 'Unknown' };
    
    const ua = userAgent.toLowerCase();
    let device = 'Desktop';
    if (ua.includes('mobile')) device = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
    
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    return { device, browser, os };
  };

  const getDeviceIcon = (userAgent: string | null) => {
    const info = parseDeviceInfo(userAgent);
    
    if (info.device === 'Mobile') {
      return <Smartphone className="h-5 w-5" />;
    } else if (info.device === 'Tablet') {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceDescription = (userAgent: string | null) => {
    const info = parseDeviceInfo(userAgent);
    return `${info.browser} on ${info.os}`;
  };

  const otherSessionsCount = activeSessions.filter(s => !s.is_current).length;

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
              <Globe className="h-5 w-5" />
              Active Sessions
              <Badge variant="secondary" className="ml-2">
                {activeSessions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage your active sessions across all devices. You can log out from any session.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshSessions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No active sessions found.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    session.is_current ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      session.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {getDeviceDescription(session.user_agent)}
                        </p>
                        {session.is_current && (
                          <Badge variant="default" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            This Device
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.is_current 
                            ? 'Active now'
                            : `Last active ${formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}`
                          }
                        </span>
                        <span className="text-xs">
                          • Started {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!session.is_current && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={revokingId === session.id}
                        >
                          {revokingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-1" />
                              Log out
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Log out this session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately log out the session on {getDeviceDescription(session.user_agent)}. 
                            The user will need to sign in again on that device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevokeSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Log out session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>

            {otherSessionsCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive"
                    disabled={revokingAll}
                  >
                    {revokingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out all other sessions ({otherSessionsCount})
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out all other sessions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately log out all sessions except the current one. 
                      You'll need to sign in again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevokeAllOther}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Log out all other sessions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
