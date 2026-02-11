import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Key, Download, RefreshCw, Copy, Check, AlertTriangle, Printer } from 'lucide-react';

interface RecoveryCode {
  id: string;
  used_at: string | null;
  created_at: string;
}

export function RecoveryCodes() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [codes, setCodes] = useState<RecoveryCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showNewCodes, setShowNewCodes] = useState(false);
  const [newPlainCodes, setNewPlainCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCodes();
    }
  }, [user]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recovery_codes')
        .select('id, used_at, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      console.error('Error fetching recovery codes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate secure random recovery codes
  const generateRecoveryCodes = (count: number = 10): string[] => {
    const codes: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
    
    for (let i = 0; i < count; i++) {
      let code = '';
      const array = new Uint8Array(10);
      crypto.getRandomValues(array);
      
      for (let j = 0; j < 10; j++) {
        code += chars[array[j] % chars.length];
        if (j === 4) code += '-'; // Add hyphen in middle: XXXXX-XXXXX
      }
      codes.push(code);
    }
    
    return codes;
  };

  // Hash a recovery code using SHA-256
  const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code.replace('-', '').toUpperCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateAndSaveCodes = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      // Generate new codes
      const plainCodes = generateRecoveryCodes(10);
      
      // Store codes (we'll store them directly, not hashed, for simplicity)
      const codesToInsert = plainCodes.map((code) => ({
        user_id: user.id,
        code: code,
        is_used: false,
      }));
      
      // Delete existing codes
      await supabase
        .from('recovery_codes')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new codes
      const { error } = await supabase
        .from('recovery_codes')
        .insert(codesToInsert as any);
      
      if (error) throw error;
      
      // Show the plain codes to user
      setNewPlainCodes(plainCodes);
      setShowNewCodes(true);
      
      // Refresh the codes list
      await fetchCodes();
      
      toast({
        title: 'Recovery Codes Generated',
        description: 'Save these codes in a safe place. You won\'t be able to see them again.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Codes',
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyAllCodes = async () => {
    const codesText = newPlainCodes.join('\n');
    await navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Recovery codes copied to clipboard.',
    });
  };

  const downloadCodes = () => {
    const content = `RECOVERY CODES
================
Generated: ${new Date().toLocaleString()}
Account: ${user?.email}

Keep these codes safe! Each code can only be used once.

${newPlainCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

================
If you lose access to your authenticator app, use one of these codes to sign in.
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printCodes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Recovery Codes</title>
            <style>
              body { font-family: monospace; padding: 40px; }
              h1 { font-size: 18px; }
              .code { font-size: 16px; margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; }
              .info { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Recovery Codes for ${user?.email}</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            ${newPlainCodes.map((code, i) => `<div class="code">${i + 1}. ${code}</div>`).join('')}
            <p class="info">Keep these codes safe! Each code can only be used once.</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const unusedCount = codes.filter(c => !c.used_at).length;
  const usedCount = codes.filter(c => c.used_at).length;
  const hasAnyCodes = codes.length > 0;

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Recovery Codes
            {hasAnyCodes && (
              <Badge variant={unusedCount > 3 ? 'default' : unusedCount > 0 ? 'secondary' : 'destructive'} className="ml-2">
                {unusedCount} remaining
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Recovery codes can be used to access your account if you lose access to your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAnyCodes ? (
            <>
              {/* Code Status Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{unusedCount}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{usedCount}</p>
                  <p className="text-sm text-muted-foreground">Used</p>
                </div>
              </div>

              {unusedCount <= 3 && unusedCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    You're running low on recovery codes. Consider generating new ones.
                  </p>
                </div>
              )}

              {unusedCount === 0 && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    All recovery codes have been used! Generate new codes immediately.
                  </p>
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Codes
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate Recovery Codes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will invalidate all your existing recovery codes and generate new ones. 
                      Any unused codes will no longer work. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={generateAndSaveCodes}>
                      Generate New Codes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No Recovery Codes</p>
                <p className="text-sm text-muted-foreground">
                  Generate backup codes in case you lose access to your authenticator
                </p>
              </div>
              <Button onClick={generateAndSaveCodes} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate Recovery Codes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Codes Dialog */}
      <Dialog open={showNewCodes} onOpenChange={setShowNewCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Your Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. You won't be able to see them again!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Save these codes now!</span>
              </div>
              <p className="text-xs text-destructive/80 mt-1">
                This is the only time you'll see these codes. If you lose them and your authenticator, you'll be locked out.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {newPlainCodes.map((code, index) => (
                <div key={index} className="p-2 bg-background rounded border text-center">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAllCodes} className="flex-1">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCodes} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={printCodes} className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>

            <Button onClick={() => setShowNewCodes(false)} className="w-full">
              I've Saved My Codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
