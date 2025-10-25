export interface UserSession {
  sessionId: string;
  city: string;
  startDate: string;
  endDate: string;
  interests: string[];
}

export interface Attraction {
  id?: string;
  name: string;
  description: string;
  duration_hr: number;
  category: string;
  latitude?: number;
  longitude?: number;
  coordinates?: [number, number];
  selected?: boolean;
}

export interface RouteStop {
  attraction: Attraction;
  order: number;
  startTime: string;
  endTime: string;
  travelTimeToNext?: number;
  day: number;
}

export interface TravelRoute {
  stops: RouteStop[];
  totalDuration: number;
  summary: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
