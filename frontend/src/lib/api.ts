import axios from 'axios';
import type { UserSession, Attraction, TravelRoute } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async initSession(data: {
    city: string;
    startDate: string;
    endDate: string;
    interests: string[];
  }): Promise<UserSession> {
    const response = await axios.post(`${API_URL}/api/init`, data);
    return response.data;
  },

  async getRecommendations(sessionId: string): Promise<Attraction[]> {
    const response = await axios.post(`${API_URL}/api/recommend`, {
      session_id: sessionId,
    });
    return response.data.attractions;
  },

  async generateRoute(
    sessionId: string,
    selectedAttractions: Attraction[]
  ): Promise<TravelRoute> {
    const response = await axios.post(`${API_URL}/api/route`, {
      session_id: sessionId,
      attractions: selectedAttractions,
    });
    return response.data;
  },

  async refineRoute(
    sessionId: string,
    message: string,
    currentRoute: TravelRoute
  ): Promise<TravelRoute> {
    const response = await axios.post(`${API_URL}/api/refine`, {
      session_id: sessionId,
      message,
      current_route: currentRoute,
    });
    return response.data;
  },
};
