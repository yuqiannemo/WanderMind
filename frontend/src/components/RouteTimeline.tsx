"use client";

import { motion } from 'framer-motion';
import { Clock, MapPin, Navigation } from 'lucide-react';
import type { RouteStop } from '@/types';

interface RouteTimelineProps {
  stops: RouteStop[];
}

export default function RouteTimeline({ stops }: RouteTimelineProps) {
  const groupedByDay = stops.reduce((acc, stop) => {
    if (!acc[stop.day]) {
      acc[stop.day] = [];
    }
    acc[stop.day].push(stop);
    return acc;
  }, {} as Record<number, RouteStop[]>);

  return (
    <div className="space-y-6 p-6">
      <h3 className="text-xl font-bold text-slate-900">Your Itinerary</h3>

      {Object.entries(groupedByDay).map(([day, dayStops]) => (
        <div key={day} className="space-y-4">
          <h4 className="font-semibold text-lg text-slate-700 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-sm">
              {day}
            </div>
            Day {day}
          </h4>

          <div className="space-y-3">
            {dayStops
              .sort((a, b) => a.order - b.order)
              .map((stop, index) => (
                <motion.div
                  key={stop.order}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-8"
                >
                  {/* Timeline line */}
                  {index < dayStops.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300"></div>
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-white shadow"></div>

                  <div className="glass-effect rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-slate-900">
                        {stop.attraction.name}
                      </h5>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        #{stop.order}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">
                      {stop.attraction.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stop.startTime} - {stop.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {stop.attraction.duration_hr}h visit
                      </div>
                    </div>

                    {stop.travelTimeToNext && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-1 text-xs text-slate-500">
                        <Navigation className="w-3 h-3" />
                        {stop.travelTimeToNext} min travel to next stop
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
