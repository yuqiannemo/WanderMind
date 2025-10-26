"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  // Update mode when initialMode changes and modal is open
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Reset form when switching modes
      setEmail('');
      setPassword('');
      setName('');
      setError('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        await signup(email, password, name);
      }
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorMessage = err.message || err.toString() || 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header with Tabs */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div></div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                      mode === 'login'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                      mode === 'signup'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">
                  {mode === 'login' ? 'Welcome Back' : 'Join WanderMind'}
                </h2>
                <p className="text-white/90 text-sm">
                  {mode === 'login'
                    ? 'Login to access your saved trips'
                    : 'Create an account to save your travel preferences'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {/* Name (Signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required={mode === 'signup'}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                    </div>
                  ) : mode === 'login' ? (
                    'Login'
                  ) : (
                    'Sign Up'
                  )}
                </button>

                {/* Toggle Mode */}
                <div className="text-center pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="ml-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                      {mode === 'login' ? 'Sign Up' : 'Login'}
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
