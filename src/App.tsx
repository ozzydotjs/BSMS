import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, isStaffRole, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { StaffDashboard } from './pages/StaffDashboard';
import { ResidentPortal } from './pages/ResidentPortal';

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4 animate-pulse">
        <div className="h-5 w-44 rounded bg-slate-200 mx-auto" />
        <div className="h-3.5 w-56 rounded bg-slate-100 mx-auto" />
        <div className="h-10 w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}

function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaffRole(user.role)) return <Navigate to="/portal" replace />;
  return <>{children}</>;
}

function RequireResident({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (isStaffRole(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function LoginOrRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) {
    return (
      <Navigate
        to={isStaffRole(user.role) ? '/dashboard' : '/portal'}
        replace
      />
    );
  }
  return <LoginPage />;
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={isStaffRole(user.role) ? '/dashboard' : '/portal'}
      replace
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginOrRedirect />} />
          <Route
            path="/dashboard"
            element={
              <RequireStaff>
                <StaffDashboard />
              </RequireStaff>
            }
          />
          <Route
            path="/portal"
            element={
              <RequireResident>
                <ResidentPortal />
              </RequireResident>
            }
          />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
