import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFirestore } from '../hooks/useFirestore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { role, loading } = useFirestore();
  const location = useLocation();

  console.log("ProtectedRoute - Role:", role, "Loading:", loading);

  // CRITICAL: Show loading state while checking auth and role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-navy mx-auto mb-4" />
          <p className="text-brand-navy font-bold animate-pulse uppercase tracking-widest text-[10px]">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // Check admin access if required
  if (adminOnly) {
    if (role !== 'admin') {
      console.log("Not an admin, redirecting to login.");
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } else {
    // For normal protected routes, just check if user is logged in
    if (!role) {
      console.log("No user found, redirecting to login.");
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
}
