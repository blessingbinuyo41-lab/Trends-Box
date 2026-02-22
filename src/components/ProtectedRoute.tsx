import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from './AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mx-auto">
            <Zap size={32} />
          </div>
          <div className="flex items-center gap-2 text-black/60">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Loading Trends Box...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm 
        mode={authMode} 
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} 
      />
    );
  }

  return <>{children}</>;
}