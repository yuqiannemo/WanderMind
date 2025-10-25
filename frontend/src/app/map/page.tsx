"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Compass,
  Sparkles,
  Map as MapIcon,
  MessageSquare,
  Loader2,
  ChevronRight,
  ChevronLeft,
  History,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { UserSession, Attraction, TravelRoute, Message } from '@/types';
import ChatPanel from '@/components/ChatPanel';
import RouteTimeline from '@/components/RouteTimeline';
import PlanHistorySidebar from '@/components/PlanHistorySidebar';
import { useAuth } from '@/contexts/AuthContext';

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [session, setSession] = useState<UserSession | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [route, setRoute] = useState<TravelRoute | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);

  useEffect(() => {
    const sessionData = localStorage.getItem('wandermind_session');
    if (!sessionData) {
      router.push('/onboard');
      return;
    }

    const parsedSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Set map center from session city coordinates
    if (parsedSession.cityCoordinates) {
      setMapCenter(parsedSession.cityCoordinates as [number, number]);
    }

    // Load recommendations
    loadRecommendations(parsedSession.sessionId);
  }, [router]);

  const loadRecommendations = async (sessionId: string) => {
    try {
      setIsLoadingRecommendations(true);
      const data = await api.getRecommendations(sessionId);
      setAttractions(data);
      
      // Set map center to first attraction if available
      if (data.length > 0 && data[0].coordinates) {
        setMapCenter(data[0].coordinates as [number, number]);
      }
      
      setMessages([
        {
          role: 'assistant',
          content: `I've found ${data.length} amazing attractions${session ? ` in ${session.city}` : ''}! Click on the markers to learn more and add them to your route.`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I had trouble finding attractions. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleAttractionClick = (attraction: Attraction) => {
    setAttractions((prev) =>
      prev.map((a) =>
        a.id === attraction.id ? { ...a, selected: !a.selected } : a
      )
    );
  };

  const handleGenerateRoute = async () => {
    if (!session) return;

    const selectedAttractions = attractions.filter((a) => a.selected);
    if (selectedAttractions.length < 2) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Please select at least 2 attractions to generate a route.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    try {
      setIsLoading(true);
      const generatedRoute = await api.generateRoute(
        session.sessionId,
        selectedAttractions
      );
      setRoute(generatedRoute);
      setShowTimeline(true);
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: generatedRoute.summary,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to generate route:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble generating your route. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!session || !route) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    ]);

    try {
      setIsLoading(true);
      const refinedRoute = await api.refineRoute(session.sessionId, message, route);
      setRoute(refinedRoute);
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: refinedRoute.summary,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to refine route:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble refining your route. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!route || !session || !user || !token) {
      alert('Please log in to save your plan');
      return;
    }

    setIsSavingPlan(true);
    try {
      console.log('Saving plan with token:', token ? 'Token present' : 'No token');
      await api.savePlan(session.sessionId, route, null, token);
      alert('Plan saved successfully!');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '✅ Your trip plan has been saved! You can view it anytime from your history.',
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to save plan';
      alert(errorMsg);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const selectedCount = attractions.filter((a) => a.selected).length;

  return (
    <div className="h-screen flex flex-col">
      {/* History Sidebar */}
      <PlanHistorySidebar 
        isOpen={showHistorySidebar} 
        onClose={() => setShowHistorySidebar(false)} 
      />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setShowHistorySidebar(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="View Trip History"
              >
                <History className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <Compass className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WanderMind
              </h1>
              {session && (
                <p className="text-sm text-slate-600">
                  {session.city} • {session.startDate} to {session.endDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">
                ✓
              </div>
              <span>Setup</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                2
              </div>
              <span className="font-medium">
                {route ? 'Route' : 'Explore'}
              </span>
            </div>
            {route && (
              <>
                <div className="w-12 h-0.5 bg-blue-600"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    3
                  </div>
                  <span className="font-medium">Complete</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat (collapsible) */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-slate-200 bg-white overflow-hidden"
            >
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Panel - Map */}
        <div className="flex-1 relative">
          {isLoadingRecommendations ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600">Claude is finding the best attractions...</p>
            </div>
          ) : (
            <>
              <div className="w-full h-full p-4">
                <MapComponent
                  attractions={attractions}
                  route={route?.stops}
                  onAttractionClick={!route ? handleAttractionClick : undefined}
                  center={mapCenter}
                />
              </div>

              {/* Floating Controls */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-[1000]">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`glass-effect px-6 py-3 rounded-full font-medium transition-all hover:shadow-xl flex items-center gap-2 ${
                    showChat ? 'bg-blue-600 text-white' : 'text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat
                </button>

                {!route && (
                  <button
                    onClick={handleGenerateRoute}
                    disabled={selectedCount < 2 || isLoading}
                    className="gradient-btn text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Route ({selectedCount})
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Toggle Chat/Timeline buttons */}
              <div className="absolute left-4 top-4 flex flex-col gap-2 z-[1000]">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="glass-effect w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:shadow-lg transition-all"
                  title={showChat ? 'Hide Chat' : 'Show Chat'}
                >
                  {showChat ? <ChevronLeft /> : <MessageSquare />}
                </button>
              </div>

              {route && (
                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                  {user && (
                    <button
                      onClick={handleSavePlan}
                      disabled={isSavingPlan}
                      className="glass-effect w-12 h-12 rounded-xl flex items-center justify-center text-green-600 hover:shadow-lg transition-all disabled:opacity-50"
                      title="Save Plan"
                    >
                      {isSavingPlan ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="glass-effect w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:shadow-lg transition-all"
                    title={showTimeline ? 'Hide Timeline' : 'Show Timeline'}
                  >
                    {showTimeline ? <ChevronRight /> : <MapIcon />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel - Timeline (collapsible) */}
        <AnimatePresence>
          {showTimeline && route && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-200 bg-white overflow-y-auto"
            >
              <RouteTimeline stops={route.stops} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
