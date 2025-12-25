// Protected Route Component with Role-Based Access Control (RBAC)
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/store/authStore";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Required roles to access this route
   * - 'admin': Requires superuser/admin role
   * - 'analyst': Requires analyst or admin role
   * - 'viewer': Requires any authenticated user
   * - undefined: Any authenticated user (default)
   */
  requiredRole?: 'admin' | 'analyst' | 'viewer';
  /**
   * Fallback component to show when user doesn't have required role
   */
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role-based access
  if (requiredRole) {
    // Access store directly to avoid hook issues
    const store = useAuthStore.getState();
    const hasAccess = store.hasRole(requiredRole);
    
    if (!hasAccess) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default access denied UI
      const isAdmin = store.isAdmin();
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>
                    You don't have permission to access this page.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This page requires <strong>{requiredRole}</strong> role or higher.
                {isAdmin && (
                  <span className="block mt-2 text-xs">
                    Your current role: <strong>admin</strong>
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-sm font-medium text-primary hover:underline"
                >
                  Go Back
                </button>
                <button
                  onClick={() => window.location.href = '/app'}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Go to Dashboard
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};
