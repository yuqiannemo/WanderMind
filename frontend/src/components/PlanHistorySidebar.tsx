"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Trash2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

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

interface PlanHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlanHistorySidebar({ isOpen, onClose }: PlanHistorySidebarProps) {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user && token) {
      loadPlans();
    }
  }, [isOpen, user, token]);

  const loadPlans = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Loading plans with token:', token ? 'Token present' : 'No token');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-[1200] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Trip History</h2>
                <p className="text-white/80 text-sm mt-1">
                  {plans.length} saved {plans.length === 1 ? 'plan' : 'plans'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 mt-8">{error}</div>
              ) : plans.length === 0 ? (
                <div className="text-center text-slate-400 mt-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No saved plans yet</p>
                  <p className="text-sm mt-2">Start planning your first trip!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 rounded-xl p-4 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {plan.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {plan.city}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{plan.route.stops?.length || 0} stops</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {plan.interests.slice(0, 3).map((interest) => (
                          <span
                            key={interest}
                            className="px-2 py-1 bg-white text-xs text-slate-600 rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                        {plan.interests.length > 3 && (
                          <span className="px-2 py-1 bg-white text-xs text-slate-600 rounded-full">
                            +{plan.interests.length - 3} more
                          </span>
                        )}
                      </div>

                      <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-all">
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
