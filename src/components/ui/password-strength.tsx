import { Check, X, AlertTriangle, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: {
    score: number;
    label: string;
    color: string;
    checks: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
  };
  leakCheck?: {
    isLeaked: boolean;
    count?: number;
    checking: boolean;
    error?: string;
  };
  showChecks?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  strength,
  leakCheck,
  showChecks = true,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const checkItems = [
    { key: 'length', label: 'At least 8 characters', passed: strength.checks.length },
    { key: 'uppercase', label: 'Uppercase letter (A-Z)', passed: strength.checks.uppercase },
    { key: 'lowercase', label: 'Lowercase letter (a-z)', passed: strength.checks.lowercase },
    { key: 'number', label: 'Number (0-9)', passed: strength.checks.number },
    { key: 'special', label: 'Special character (!@#$%...)', passed: strength.checks.special },
  ];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={cn(
            "font-medium",
            strength.score <= 1 && "text-destructive",
            strength.score === 2 && "text-yellow-600",
            strength.score >= 3 && "text-green-600"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                index <= strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Leak Check Warning */}
      {leakCheck && (
        <div className="flex items-center gap-2 text-xs">
          {leakCheck.checking ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Checking password security...</span>
            </>
          ) : leakCheck.isLeaked ? (
            <>
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">
                This password has been exposed in {leakCheck.count?.toLocaleString()} data breaches. 
                Please choose a different password.
              </span>
            </>
          ) : leakCheck.error ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-yellow-600">Could not verify password security</span>
            </>
          ) : password.length >= 6 ? (
            <>
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Password not found in known data breaches</span>
            </>
          ) : null}
        </div>
      )}

      {/* Requirement Checks */}
      {showChecks && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {checkItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                item.passed ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {item.passed ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
