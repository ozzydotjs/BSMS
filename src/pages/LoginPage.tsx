import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { isStaffRole, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const { signInWithSupabase } = useAuth();
  const navigate = useNavigate();

  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hallImageError, setHallImageError] = useState(false);
  const [sealImageError, setSealImageError] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (isRegistering && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegistering) {
        // --- REGISTRATION FLOW ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                full_name: fullName,
                role: 'resident',
              },
            ]);

          if (profileError) throw profileError;

          toast.success('Registration successful! Please sign in.');
          setIsRegistering(false);
          setPassword('');
        }
      } else {
        // --- LOGIN FLOW ---
        const signedIn = await signInWithSupabase(email, password);
        toast.success(`Welcome back, ${signedIn.fullName}`);
        navigate(isStaffRole(signedIn.role) ? '/dashboard' : '/portal', { replace: true });
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Please contact the Barangay Secretary to reset your password.');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* LEFT PANEL: Branding & Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-civic-navy overflow-hidden flex-col justify-between p-12">
        {/* Background Image with Navy Overlay */}
        {!hallImageError && (
          <div className="absolute inset-0 z-0">
            <img
              src="/src/assets/images/barangay_civic_hall_1795224924806.jpg"
              alt="Barangay Sugcad Civic Hall"
              referrerPolicy="no-referrer"
              onError={() => setHallImageError(true)}
              className="h-full w-full object-cover opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-civic-navy via-civic-navy/80 to-transparent" />
          </div>
        )}

        {/* Top Header - Official text */}
        <div className="relative z-10 text-blue-200 text-sm tracking-widest uppercase font-semibold">
          <p>Republic of the Philippines</p>
          <p className="text-xs text-blue-300/70 mt-1">Province of Albay • Municipality of Polangui</p>
        </div>

        {/* Center Main Branding */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
             {/* Seal */}
            {!sealImageError ? (
              <img
                src="/src/assets/images/barangay_civic_seal_1795224924120.jpg"
                alt="Official Barangay Sugcad Seal"
                referrerPolicy="no-referrer"
                onError={() => setSealImageError(true)}
                className="h-24 w-24 rounded-full border-4 border-white/20 object-cover shadow-2xl"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20 text-white shadow-2xl">
                <Building2 className="h-12 w-12" aria-hidden="true" />
              </div>
            )}
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-4">
            Barangay Sugcad <br />
            <span className="text-blue-300">Management System</span>
          </h1>
          <p className="text-lg text-blue-100/90 leading-relaxed">
            Official Staff Operations & Resident e-Services Portal. Providing fast, transparent, and secure local government services.
          </p>
        </div>

        {/* Bottom Footer Info */}
        <div className="relative z-10 text-sm text-blue-300/60 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure Government Portal</span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 relative">
        {/* Mobile Background (since left panel is hidden) */}
        <div className="lg:hidden absolute inset-0 z-0 overflow-hidden bg-slate-50">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-civic-navy/5" />
        </div>

        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Logo (Only shows on small screens) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            {!sealImageError ? (
              <img
                src="/src/assets/images/barangay_civic_seal_1795224924120.jpg"
                alt="Seal"
                className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm mb-4"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-civic-navy text-white shadow-sm mb-4">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <h1 className="font-display text-2xl font-bold text-slate-900">Barangay Sugcad</h1>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
              {isRegistering ? 'Create a Resident Account' : 'Sign in to Portal'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isRegistering 
                ? 'Enter your details to register for the e-Services portal.' 
                : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {errorMsg && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <div>{errorMsg}</div>
              </div>
            )}

            {isRegistering && (
              <div>
                <label htmlFor="register-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-civic-navy focus:outline-none focus:ring-2 focus:ring-civic-navy/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sugcad.gov.ph"
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-civic-navy focus:outline-none focus:ring-2 focus:ring-civic-navy/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                {!isRegistering && (
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-civic-navy hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-civic-navy focus:outline-none focus:ring-2 focus:ring-civic-navy/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-civic-navy px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-civic-navy-hover disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-navy focus-visible:ring-offset-2 mt-2"
            >
              {submitting 
                ? (isRegistering ? 'Creating Account...' : 'Signing In...') 
                : (isRegistering ? 'Register Account' : 'Sign In to Portal')}
            </button>
          </form>

          {/* Toggle Mode Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMsg(null);
                }}
                className="font-semibold text-civic-navy hover:underline"
              >
                {isRegistering ? 'Sign In' : 'Register here'}
              </button>
            </p>
          </div>
          
          {/* Footer */}
          <div className="mt-12 text-center text-xs text-slate-400">
            <p>© 2026 Barangay Sugcad. All rights reserved.</p>
          </div>

        </div>
      </div>
    </div>
  );
}