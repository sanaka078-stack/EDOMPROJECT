import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type AllowedRole = 'admin' | 'manager' | 'support' | 'user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AllowedRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, loading, role, roleLoading } = useAuth();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Store the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has one of them
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = role && allowedRoles.includes(role);
    
    if (!hasRequiredRole) {
      // Redirect based on user's actual role
      if (role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (role === 'manager') {
        return <Navigate to="/manager/dashboard" replace />;
      } else if (role === 'support') {
        return <Navigate to="/support/dashboard" replace />;
      } else {
        return <Navigate to={redirectTo || "/account"} replace />;
      }
    }
  }

  return <>{children}</>;
}

// Component for customer/user-only routes
export function CustomerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['user']} redirectTo="/account">
      {children}
    </ProtectedRoute>
  );
}

// Component for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/">
      {children}
    </ProtectedRoute>
  );
}

// Component for manager routes (manager or admin can access)
export function ManagerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/">
      {children}
    </ProtectedRoute>
  );
}

// Component for support routes (support, manager, or admin can access)
export function SupportRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'manager', 'support']} redirectTo="/">
      {children}
    </ProtectedRoute>
  );
}

// Component for staff routes (admin, manager, or support)
export function StaffRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'manager', 'support']} redirectTo="/">
      {children}
    </ProtectedRoute>
  );
}
