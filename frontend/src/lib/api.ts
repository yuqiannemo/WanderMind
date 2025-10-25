import axios from 'axios';
import type { UserSession, Attraction, TravelRoute } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    interests: string[];
    created_at: string;
  };
}

export const api = {
  // Authentication
  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/signup`, {
      email,
      password,
      name,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  async getMe(token: string) {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async updatePreferences(interests: string[], token: string) {
    const response = await axios.put(
      `${API_URL}/api/auth/preferences`,
      interests,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  // Travel planning
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

  // Trip plan management
  async savePlan(sessionId: string, route: TravelRoute, title: string | null, token: string) {
    const response = await axios.post(
      `${API_URL}/api/plans/save`,
      {
        session_id: sessionId,
        route,
        title,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getPlans(token: string) {
    const response = await axios.get(`${API_URL}/api/plans`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getPlanById(planId: string, token: string) {
    const response = await axios.get(`${API_URL}/api/plans/${planId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async deletePlan(planId: string, token: string) {
    const response = await axios.delete(`${API_URL}/api/plans/${planId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
