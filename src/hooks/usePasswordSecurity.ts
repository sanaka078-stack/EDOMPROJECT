import { useState, useCallback } from 'react';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

interface LeakCheckResult {
  isLeaked: boolean;
  count?: number;
  checking: boolean;
  error?: string;
}

export function usePasswordSecurity() {
  const [leakCheck, setLeakCheck] = useState<LeakCheckResult>({
    isLeaked: false,
    checking: false,
  });

  const calculateStrength = useCallback((password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    // Calculate score based on checks and length
    let score = 0;
    if (password.length >= 6) score = 1;
    if (passedChecks >= 3) score = 2;
    if (passedChecks >= 4 && password.length >= 10) score = 3;
    if (passedChecks === 5 && password.length >= 12) score = 4;

    const strengthLabels = [
      { label: 'Very Weak', color: 'bg-destructive' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-lime-500' },
      { label: 'Very Strong', color: 'bg-green-500' },
    ];

    return {
      score,
      label: strengthLabels[score].label,
      color: strengthLabels[score].color,
      checks,
    };
  }, []);

  const checkLeakedPassword = useCallback(async (password: string): Promise<boolean> => {
    if (!password || password.length < 6) {
      setLeakCheck({ isLeaked: false, checking: false });
      return false;
    }

    setLeakCheck({ isLeaked: false, checking: true });

    try {
      // Use SHA-1 hash and k-anonymity model for privacy
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      // Query HaveIBeenPwned API with k-anonymity
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: {
          'Add-Padding': 'true', // Adds padding to prevent timing attacks
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check password');
      }

      const text = await response.text();
      const hashes = text.split('\n');
      
      for (const line of hashes) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          const leakCount = parseInt(count.trim(), 10);
          setLeakCheck({ isLeaked: true, count: leakCount, checking: false });
          return true;
        }
      }

      setLeakCheck({ isLeaked: false, checking: false });
      return false;
    } catch (error: any) {
      setLeakCheck({ isLeaked: false, checking: false, error: error.message });
      return false;
    }
  }, []);

  const resetLeakCheck = useCallback(() => {
    setLeakCheck({ isLeaked: false, checking: false });
  }, []);

  return {
    calculateStrength,
    checkLeakedPassword,
    leakCheck,
    resetLeakCheck,
  };
}
