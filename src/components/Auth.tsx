import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Loader as Loader2, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { PrivacyPolicyModal, TermsModal } from './LegalModals';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthProps {
  initialMode?: AuthMode;
  onBackToLanding?: () => void;
}

export default function Auth({ initialMode = 'signin', onBackToLanding }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Legal Modals state
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: window.location.origin,
          }
        });

        if (signUpError) throw signUpError;

        // If email confirmation is disabled on Supabase, the user session is returned immediately
        if (data.session) {
          return;
        }

        // If email confirmation is enabled, display verification screen
        setSignupSuccess(true);
      } else if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        if (signInError) throw signInError;
      } else if (mode === 'forgot') {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/#type=recovery`,
        });

        if (resetError) throw resetError;
        setForgotSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Sign up verification success view
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-black/5 overflow-hidden text-center p-8 md:p-12 space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto">
            <Mail size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Check your email</h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
              We sent a verification link to <span className="text-neutral-900 font-semibold">{email}</span>. Click the link to complete your Trends Box activation.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => {
              setSignupSuccess(false);
              setMode('signin');
            }}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Return to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  // Forgot password success view
  if (forgotSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-black/5 overflow-hidden text-center p-8 md:p-12 space-y-6"
        >
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg mx-auto">
            <KeyRound size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Password Reset Sent</h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
              We dispatched a secure password reset link to <span className="text-neutral-900 font-semibold">{email}</span>. Open it to set your new password.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => {
              setForgotSuccess(false);
              setMode('signin');
            }}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Back to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4 relative">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-black/5 overflow-hidden"
      >
        <div className="p-8 md:p-10 space-y-6 relative">
          {/* Back to Home Button */}
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="absolute top-6 left-6 text-xs text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Home</span>
            </button>
          )}

          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg p-2">
              <img 
                src="/Trends_Box_Icon_20260302_211907_0000.png" 
                alt="Trends Box Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Trends Box</h1>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={mode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="text-xs text-neutral-500 font-medium"
                >
                  {mode === 'signup' && 'Create your account to start generating verified news'}
                  {mode === 'signin' && 'Sign in to access your editorial dashboard'}
                  {mode === 'forgot' && 'Reset your password securely via email'}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Full Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                  <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Blessing Binuyo"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F5F5F5] border border-transparent rounded-2xl focus:bg-white focus:border-black/15 transition-all outline-none text-xs font-medium"
                  />
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F5F5F5] border border-transparent rounded-2xl focus:bg-white focus:border-black/15 transition-all outline-none text-xs font-medium"
                />
              </div>
            </div>

            {/* Password Field (Sign In & Sign Up) */}
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-[11px] font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                  <input 
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F5F5F5] border border-transparent rounded-2xl focus:bg-white focus:border-black/15 transition-all outline-none text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signup' && 'Create Free Account'}
                    {mode === 'signin' && 'Sign In to Dashboard'}
                    {mode === 'forgot' && 'Send Password Reset Link'}
                  </span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switching */}
          <div className="text-center pt-2 space-y-2 border-t border-black/5">
            {mode === 'signin' && (
              <button 
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                Don't have an account? <span className="font-bold text-black underline underline-offset-2">Sign Up Free</span>
              </button>
            )}

            {mode === 'signup' && (
              <button 
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                Already have an account? <span className="font-bold text-black underline underline-offset-2">Sign In</span>
              </button>
            )}

            {mode === 'forgot' && (
              <button 
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Return to Sign In</span>
              </button>
            )}
          </div>

          {/* Legal Links Agreement */}
          <div className="text-center text-[10px] text-neutral-400 space-x-1 leading-normal pt-1">
            <span>By proceeding, you agree to our</span>
            <button 
              type="button" 
              onClick={() => setShowTerms(true)}
              className="text-neutral-600 hover:text-black underline cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <span>and</span>
            <button 
              type="button" 
              onClick={() => setShowPrivacy(true)}
              className="text-neutral-600 hover:text-black underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>.</span>
          </div>
        </div>
      </motion.div>

      {/* Brand Signature Watermark */}
      <div className="mt-6 text-center text-xs text-neutral-500 font-medium">
        With ❤️ from <span className="font-bold text-neutral-800">Binuyo Legacy Hub</span>
      </div>

      {/* Modals */}
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}
