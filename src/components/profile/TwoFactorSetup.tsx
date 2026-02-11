import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Shield, ShieldCheck, ShieldOff, Smartphone, Copy, Check } from 'lucide-react';

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export function TwoFactorSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  
  // Enrollment state
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFactors();
    }
  }, [user]);

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      // Filter to only show TOTP factors
      const totpFactors = data?.totp || [];
      setFactors(totpFactors);
    } catch (error: any) {
      console.error('Error fetching MFA factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setShowEnrollment(true);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '2FA Setup Failed',
        description: error.message,
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndActivate = async () => {
    if (!factorId || verificationCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit code.',
      });
      return;
    }

    setVerifying(true);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the challenge
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been successfully enabled.',
      });

      // Reset state
      setShowEnrollment(false);
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerificationCode('');
      
      // Refresh factors list
      await fetchFactors();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code. Please try again.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const cancelEnrollment = async () => {
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (error) {
        // Ignore errors during cancel
      }
    }
    setShowEnrollment(false);
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
  };

  const removeFactor = async (id: string) => {
    setRemoving(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });

      if (error) throw error;

      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
      });

      await fetchFactors();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Remove 2FA',
        description: error.message,
      });
    } finally {
      setRemoving(false);
    }
  };

  const copySecret = async () => {
    if (secret) {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasActiveFactor = factors.some(f => f.status === 'verified');

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
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
          {hasActiveFactor && (
            <Badge variant="default" className="bg-green-600 ml-2">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by requiring a verification code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showEnrollment ? (
          <>
            {factors.length > 0 ? (
              <div className="space-y-3">
                {factors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                        <p className="text-sm text-muted-foreground">
                          Added on {new Date(factor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={factor.status === 'verified' ? 'default' : 'secondary'}>
                        {factor.status === 'verified' ? 'Active' : 'Pending'}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={removing}>
                            {removing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldOff className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Two-Factor Authentication?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will disable two-factor authentication for your account. 
                              Your account will be less secure. Are you sure?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeFactor(factor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove 2FA
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <ShieldOff className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">2FA Not Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Protect your account with two-factor authentication
                  </p>
                </div>
              </div>
            )}

            {!hasActiveFactor && (
              <Button onClick={startEnrollment} disabled={enrolling} className="w-full">
                {enrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Enable Two-Factor Authentication
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Scan QR Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                  1
                </div>
                <h3 className="font-medium">Scan QR Code</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.
              </p>
              {qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
                </div>
              )}
            </div>

            {/* Manual Entry Option */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-sm flex items-center justify-center font-medium">
                  ?
                </div>
                <h3 className="font-medium text-sm">Can't scan?</h3>
              </div>
              <div className="ml-8 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  Enter this code manually in your authenticator app:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background p-2 rounded border break-all">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2: Verify Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                  2
                </div>
                <h3 className="font-medium">Verify Code</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Enter the 6-digit code from your authenticator app to complete setup.
              </p>
              <div className="ml-8 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={cancelEnrollment}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={verifyAndActivate}
                    disabled={verifying || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
