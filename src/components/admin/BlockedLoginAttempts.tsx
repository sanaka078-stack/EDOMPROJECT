import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Shield, 
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Search,
  Clock,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface BlockedAttempt {
  id: string;
  email: string | null;
  ip_address: string | null;
  reason: string | null;
  blocked_until: string | null;
  is_permanent: boolean;
  created_at: string;
}

export function BlockedLoginAttempts() {
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setAttempts((data || []) as BlockedAttempt[]);
    } catch (error) {
      console.error('Error fetching blocked attempts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const getStatus = (attempt: BlockedAttempt): 'active' | 'expired' => {
    if (attempt.is_permanent) return 'active';
    if (!attempt.blocked_until) return 'expired';
    return new Date(attempt.blocked_until) > new Date() ? 'active' : 'expired';
  };

  const getStatusBadge = (status: 'active' | 'expired') => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="destructive">
            <ShieldX className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
    }
  };

  const filteredAttempts = attempts.filter(attempt => {
    const status = getStatus(attempt);
    
    // Status filter
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesEmail = attempt.email?.toLowerCase().includes(query);
      const matchesIP = attempt.ip_address?.toString().includes(query);
      const matchesReason = attempt.reason?.toLowerCase().includes(query);
      
      return matchesEmail || matchesIP || matchesReason;
    }
    
    return true;
  });

  const stats = {
    total: attempts.length,
    active: attempts.filter(a => getStatus(a) === 'active').length,
    expired: attempts.filter(a => getStatus(a) === 'expired').length,
    permanent: attempts.filter(a => a.is_permanent).length,
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Blocked</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Blocks</p>
                <p className="text-2xl font-bold text-destructive">{stats.active}</p>
              </div>
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.expired}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Permanent</p>
                <p className="text-2xl font-bold text-warning">{stats.permanent}</p>
              </div>
              <Shield className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blocked Login Attempts
              </CardTitle>
              <CardDescription>
                Monitor suspicious login attempts that were blocked.
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchAttempts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, IP, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredAttempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No blocked login attempts found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => {
                    const status = getStatus(attempt);
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{attempt.email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {attempt.ip_address?.toString() || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {attempt.reason || 'Suspicious activity'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(attempt.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
