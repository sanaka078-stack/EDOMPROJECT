import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Lock, 
  Unlock, 
  Search, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface AccountLockout {
  id: string;
  email: string;
  failed_attempts: number;
  unlock_at: string | null;
  is_unlocked: boolean;
  created_at: string;
  updated_at: string;
}

interface FailedAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempt_count: number;
  last_attempt_at: string;
  created_at: string;
}

export function AccountLockouts() {
  const { user } = useAuth();
  const [lockouts, setLockouts] = useState<AccountLockout[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'lockouts' | 'attempts'>('lockouts');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch lockouts
      const { data: lockoutData, error: lockoutError } = await supabase
        .from('account_lockouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (lockoutError) throw lockoutError;
      setLockouts((lockoutData || []) as AccountLockout[]);

      // Fetch recent failed attempts
      const { data: attemptData, error: attemptError } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (attemptError) throw attemptError;
      setFailedAttempts((attemptData || []) as FailedAttempt[]);
    } catch (error: any) {
      console.error('Error fetching lockout data:', error);
      toast.error('Failed to load lockout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendUnlockAlert = async (email: string) => {
    try {
      await supabase.functions.invoke('send-unlock-alert', {
        body: {
          email,
          wasAutoUnlock: false,
        },
      });
      console.log('Unlock alert email sent');
    } catch (error) {
      console.error('Failed to send unlock alert:', error);
    }
  };

  const handleUnlock = async (lockout: AccountLockout) => {
    try {
      const { error } = await supabase
        .from('account_lockouts')
        .update({ 
          is_unlocked: true
        } as any)
        .eq('id', lockout.id);

      if (error) throw error;

      // Send unlock notification email
      await sendUnlockAlert(lockout.email);

      toast.success(`Account ${lockout.email} has been unlocked. Notification email sent.`);
      fetchData();
    } catch (error: any) {
      console.error('Error unlocking account:', error);
      toast.error('Failed to unlock account: ' + error.message);
    }
  };

  const filteredLockouts = lockouts.filter(l => 
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttempts = failedAttempts.filter(a => 
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.toString().includes(searchQuery)
  );

  const activeLockouts = lockouts.filter(l => 
    !l.is_unlocked && (!l.unlock_at || new Date(l.unlock_at) > new Date())
  );

  const isCurrentlyLocked = (lockout: AccountLockout) => {
    return !lockout.is_unlocked && (!lockout.unlock_at || new Date(lockout.unlock_at) > new Date());
  };

  const getLockedAt = (lockout: AccountLockout) => lockout.created_at;

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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Lockouts</p>
                <p className="text-2xl font-bold text-destructive">{activeLockouts.length}</p>
              </div>
              <Lock className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Lockouts</p>
                <p className="text-2xl font-bold">{lockouts.length}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Attempts (24h)</p>
                <p className="text-2xl font-bold text-warning">
                  {failedAttempts.filter(a => 
                    new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unlocked</p>
                <p className="text-2xl font-bold text-primary">
                  {lockouts.filter(l => l.is_unlocked).length}
                </p>
              </div>
              <Unlock className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                Account Lockouts & Failed Attempts
              </CardTitle>
              <CardDescription>
                Monitor and manage account security lockouts
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'lockouts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('lockouts')}
              >
                <Lock className="h-4 w-4 mr-1" />
                Lockouts ({lockouts.length})
              </Button>
              <Button
                variant={activeTab === 'attempts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('attempts')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Failed Attempts ({failedAttempts.length})
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Lockouts Table */}
          {activeTab === 'lockouts' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Locked At</TableHead>
                    <TableHead>Unlock At</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLockouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No lockouts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLockouts.map((lockout) => (
                      <TableRow key={lockout.id}>
                        <TableCell className="font-medium">{lockout.email}</TableCell>
                        <TableCell>
                          {isCurrentlyLocked(lockout) ? (
                            <Badge variant="destructive" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          ) : lockout.is_unlocked ? (
                            <Badge variant="outline" className="gap-1 text-primary border-primary/20">
                              <Unlock className="h-3 w-3" />
                              Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Expired
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(getLockedAt(lockout)), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lockout.unlock_at ? new Date(lockout.unlock_at).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {lockout.failed_attempts} failed attempts
                        </TableCell>
                        <TableCell>
                          {isCurrentlyLocked(lockout) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Unlock
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Unlock Account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will unlock the account for {lockout.email}. 
                                    They will be able to attempt login again immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnlock(lockout)}>
                                    Unlock Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Failed Attempts Table */}
          {activeTab === 'attempts' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No failed attempts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">{attempt.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {attempt.ip_address?.toString() || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {attempt.attempt_count} attempts
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
