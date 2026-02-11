import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface LoginVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  verificationToken: string;
  email: string;
  reason: string;
}

export function LoginVerificationModal({
  isOpen,
  onClose,
  onVerified,
  verificationToken,
  email,
  reason,
}: LoginVerificationModalProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-login', {
        body: {
          action: 'verify',
          verificationToken,
          verificationCode: code,
        },
      });

      if (error) throw error;

      if (data.verified) {
        toast.success('Login verified successfully!');
        onVerified();
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-login', {
        body: {
          action: 'resend',
          verificationToken,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('New verification code sent!');
        setCountdown(60);
        setCode('');
      } else {
        toast.error(data.error || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Login Verification Required
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg mt-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">{reason}</p>
                <p className="text-muted-foreground mt-1">
                  A verification code has been sent to <strong>{email}</strong>
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enter the 6-digit verification code
            </p>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={verifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || verifying}
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resending || countdown > 0}
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Resend Code
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground"
              >
                Cancel Login
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you didn't try to log in, please change your password immediately.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
