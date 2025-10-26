"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, LogOut, Calendar, MapPin, Clock, Trash2, ChevronRight, Plane, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

interface SavedPlan {
  id: string;
  userId: string;
  city: string;
  startDate: string;
  endDate: string;
  interests: string[];
  savedAt: string;
  title: string;
  route: any;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old');

  useEffect(() => {
    // Redirect non-logged-in users to home
    if (!user) {
      router.push('/');
      return;
    }

    loadPlans();
  }, [user, router]);

  const loadPlans = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const userPlans = await api.getPlans(token);
      setPlans(userPlans);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load plans';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!token || !confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await api.deletePlan(planId, token);
      setPlans(plans.filter(p => p.id !== planId));
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      alert('Failed to delete plan');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'new-to-old' ? 'old-to-new' : 'new-to-old');
  };

  const sortedPlans = [...plans].sort((a, b) => {
    const dateA = new Date(a.savedAt).getTime();
    const dateB = new Date(b.savedAt).getTime();
    return sortOrder === 'new-to-old' ? dateB - dateA : dateA - dateB;
  });

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} animated={false} />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WanderMind
              </h1>
              <p className="text-sm text-slate-600">Welcome back, {user.name}!</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Travel Plans</h2>
            <p className="text-slate-600">
              {plans.length} saved {plans.length === 1 ? 'plan' : 'plans'}
            </p>
          </div>
          
          {plans.length > 0 && (
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'new-to-old' ? 'Newest First' : 'Oldest First'}
            </button>
          )}
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 rounded-2xl p-8">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Journey Button - Always First */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/onboard')}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-dashed border-slate-300 hover:border-blue-400 min-h-[400px] flex flex-col items-center justify-center gap-4 group"
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl"
              >
                <Plus className="w-10 h-10 text-white" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-1">New Journey</h3>
                <p className="text-sm text-slate-500">Start planning your next adventure</p>
              </div>
            </motion.button>

            {/* Existing Plans */}
            {sortedPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
              >
                {/* Card Header with gradient */}
                <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-xl truncate">{plan.title}</h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{plan.city}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>
                        {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Clock className="w-4 h-4 text-pink-600" />
                      <span>{plan.route.stops?.length || 0} stops</span>
                    </div>
                  </div>

                  {/* Interests Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {plan.interests.slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-1 bg-slate-100 text-xs text-slate-600 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {plan.interests.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-xs text-slate-600 rounded-full">
                        +{plan.interests.length - 3}
                      </span>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all group-hover:scale-[1.02]">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
