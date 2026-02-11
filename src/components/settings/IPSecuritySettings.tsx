import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Globe, 
  Ban, 
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Settings,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_until: string | null;
  is_permanent: boolean;
  blocked_by: string | null;
  created_at: string;
}

interface GeoRule {
  id: string;
  country_code: string;
  country_name: string | null;
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

interface RateLimitSetting {
  id: string;
  endpoint: string;
  max_requests: number;
  window_seconds: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const COMMON_COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'KP', name: 'North Korea' },
  { code: 'IR', name: 'Iran' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'PK', name: 'Pakistan' },
];

export function IPSecuritySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [geoRules, setGeoRules] = useState<GeoRule[]>([]);
  const [rateLimitSettings, setRateLimitSettings] = useState<RateLimitSetting[]>([]);
  const [activeTab, setActiveTab] = useState('blocked-ips');
  
  // Dialog states
  const [showBlockIPDialog, setShowBlockIPDialog] = useState(false);
  const [showGeoRuleDialog, setShowGeoRuleDialog] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newIPReason, setNewIPReason] = useState('');
  const [newIPPermanent, setNewIPPermanent] = useState(false);
  const [newIPDuration, setNewIPDuration] = useState('24');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryReason, setNewCountryReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch blocked IPs
      const { data: ipsData, error: ipsError } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (ipsError) throw ipsError;
      setBlockedIPs((ipsData || []).map((ip: any) => ({
        id: ip.id,
        ip_address: String(ip.ip_address),
        reason: ip.reason,
        blocked_until: ip.blocked_until,
        is_permanent: ip.is_permanent,
        blocked_by: ip.blocked_by,
        created_at: ip.created_at,
      })));

      // Fetch geo rules
      const { data: geoData, error: geoError } = await supabase
        .from('geo_blocking_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (geoError) throw geoError;
      setGeoRules((geoData || []).map((rule: any) => ({
        id: rule.id,
        country_code: rule.country_code,
        country_name: rule.country_name,
        is_blocked: rule.is_blocked,
        reason: rule.reason,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
      })));

      // Fetch rate limit settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('ip_rate_limit_settings')
        .select('*');

      if (settingsError) throw settingsError;
      setRateLimitSettings((settingsData || []).map((setting: any) => ({
        id: setting.id,
        endpoint: setting.endpoint,
        max_requests: setting.max_requests,
        window_seconds: setting.window_seconds,
        is_enabled: setting.is_enabled,
        created_at: setting.created_at,
        updated_at: setting.updated_at,
      })));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBlockIP = async () => {
    if (!newIP.trim()) {
      toast.error('Please enter an IP address');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIP.trim())) {
      toast.error('Please enter a valid IP address');
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: newIP.trim(),
          reason: newIPReason || 'Manually blocked',
          blocked_by: user?.id,
          blocked_until: newIPPermanent ? null : new Date(Date.now() + parseInt(newIPDuration) * 60 * 60 * 1000).toISOString(),
          is_permanent: newIPPermanent,
        });

      if (error) throw error;

      toast.success(`IP ${newIP} has been blocked`);
      setShowBlockIPDialog(false);
      setNewIP('');
      setNewIPReason('');
      setNewIPPermanent(false);
      setNewIPDuration('24');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to block IP: ' + error.message);
    }
  };

  const handleUnblockIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`IP has been unblocked`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to unblock IP: ' + error.message);
    }
  };

  const handleAddGeoRule = async () => {
    if (!newCountryCode) {
      toast.error('Please select a country');
      return;
    }

    const country = COMMON_COUNTRIES.find(c => c.code === newCountryCode);

    try {
      const { error } = await supabase
        .from('geo_blocking_rules')
        .insert({
          country_code: newCountryCode,
          country_name: country?.name || newCountryCode,
          is_blocked: true,
          reason: newCountryReason || 'Manually blocked',
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success(`${country?.name || newCountryCode} has been added to blocked list`);
      setShowGeoRuleDialog(false);
      setNewCountryCode('');
      setNewCountryReason('');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to add geo rule: ' + error.message);
    }
  };

  const handleRemoveGeoRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('geo_blocking_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Geo rule removed');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to remove geo rule: ' + error.message);
    }
  };

  const handleUpdateRateLimitSetting = async (id: string, updates: Partial<RateLimitSetting>) => {
    try {
      const { error } = await supabase
        .from('ip_rate_limit_settings')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Rate limit setting updated');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update setting: ' + error.message);
    }
  };

  const isExpired = (blockedUntil: string | null, isPermanent: boolean) => {
    if (isPermanent || !blockedUntil) return false;
    return new Date(blockedUntil) < new Date();
  };

  const activeBlockedIPs = blockedIPs.filter(ip => 
    ip.is_permanent || !isExpired(ip.blocked_until, ip.is_permanent)
  );

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
                <p className="text-sm text-muted-foreground">Blocked IPs</p>
                <p className="text-2xl font-bold text-destructive">{activeBlockedIPs.length}</p>
              </div>
              <Ban className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Countries</p>
                <p className="text-2xl font-bold">{geoRules.filter(r => r.is_blocked).length}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Permanent Blocks</p>
                <p className="text-2xl font-bold text-warning">
                  {blockedIPs.filter(ip => ip.is_permanent).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Geo-Blocking</p>
                <p className="text-2xl font-bold text-primary">
                  {geoRules.filter(r => r.is_blocked).length > 0 ? 'ON' : 'OFF'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary/20" />
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
                <Shield className="h-5 w-5 text-accent" />
                IP Security & Geo-Blocking
              </CardTitle>
              <CardDescription>
                Manage IP-based rate limiting and geographic access restrictions
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="blocked-ips" className="gap-2">
                <Ban className="h-4 w-4" />
                Blocked IPs
              </TabsTrigger>
              <TabsTrigger value="geo-blocking" className="gap-2">
                <Globe className="h-4 w-4" />
                Geo-Blocking
              </TabsTrigger>
              <TabsTrigger value="rate-limits" className="gap-2">
                <Settings className="h-4 w-4" />
                Rate Limits
              </TabsTrigger>
            </TabsList>

            {/* Blocked IPs Tab */}
            <TabsContent value="blocked-ips" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showBlockIPDialog} onOpenChange={setShowBlockIPDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Block IP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block IP Address</DialogTitle>
                      <DialogDescription>
                        Add an IP address to the block list
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          placeholder="192.168.1.1"
                          value={newIP}
                          onChange={(e) => setNewIP(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason (optional)</Label>
                        <Input
                          id="reason"
                          placeholder="Suspicious activity"
                          value={newIPReason}
                          onChange={(e) => setNewIPReason(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="permanent">Permanent Block</Label>
                        <Switch
                          id="permanent"
                          checked={newIPPermanent}
                          onCheckedChange={setNewIPPermanent}
                        />
                      </div>
                      {!newIPPermanent && (
                        <div className="space-y-2">
                          <Label>Block Duration</Label>
                          <Select value={newIPDuration} onValueChange={setNewIPDuration}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="6">6 hours</SelectItem>
                              <SelectItem value="24">24 hours</SelectItem>
                              <SelectItem value="72">3 days</SelectItem>
                              <SelectItem value="168">7 days</SelectItem>
                              <SelectItem value="720">30 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowBlockIPDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBlockIP}>Block IP</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No blocked IPs
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockedIPs.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-mono font-medium">{ip.ip_address}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {ip.reason || 'No reason'}
                          </TableCell>
                          <TableCell>
                            {ip.is_permanent ? (
                              <Badge variant="destructive">Permanent</Badge>
                            ) : isExpired(ip.blocked_until, ip.is_permanent) ? (
                              <Badge variant="secondary">Expired</Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(ip.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {ip.is_permanent ? (
                              <span className="text-destructive">Never</span>
                            ) : ip.blocked_until ? (
                              new Date(ip.blocked_until).toLocaleString()
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockIP(ip.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Geo-Blocking Tab */}
            <TabsContent value="geo-blocking" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label>Geo-Blocking Rules</Label>
                </div>
                <Dialog open={showGeoRuleDialog} onOpenChange={setShowGeoRuleDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Country
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block Country</DialogTitle>
                      <DialogDescription>
                        Block access from a specific country
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select value={newCountryCode} onValueChange={setNewCountryCode}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_COUNTRIES.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="geoReason">Reason (optional)</Label>
                        <Input
                          id="geoReason"
                          placeholder="High fraud rate"
                          value={newCountryReason}
                          onChange={(e) => setNewCountryReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowGeoRuleDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddGeoRule}>Block Country</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geoRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No geo-blocking rules configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      geoRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.country_name}</TableCell>
                          <TableCell className="font-mono">{rule.country_code}</TableCell>
                          <TableCell>
                            <Badge variant={rule.is_blocked ? "destructive" : "secondary"}>
                              {rule.is_blocked ? 'Blocked' : 'Allowed'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rule.reason || 'No reason'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(rule.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveGeoRule(rule.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Rate Limits Tab */}
            <TabsContent value="rate-limits" className="space-y-4">
              <div className="grid gap-4">
                {rateLimitSettings.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No rate limit settings configured
                    </CardContent>
                  </Card>
                ) : (
                  rateLimitSettings.map((setting) => (
                    <Card key={setting.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {setting.endpoint}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Max Requests</Label>
                            <Input
                              type="number"
                              value={setting.max_requests}
                              onChange={(e) => handleUpdateRateLimitSetting(setting.id, {
                                max_requests: parseInt(e.target.value) || 10
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Time Window (seconds)</Label>
                            <Input
                              type="number"
                              value={setting.window_seconds}
                              onChange={(e) => handleUpdateRateLimitSetting(setting.id, {
                                window_seconds: parseInt(e.target.value) || 60
                              })}
                            />
                          </div>
                          <div className="space-y-2 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <Label>Enabled</Label>
                              <Switch
                                checked={setting.is_enabled}
                                onCheckedChange={(checked) => handleUpdateRateLimitSetting(setting.id, {
                                  is_enabled: checked
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
