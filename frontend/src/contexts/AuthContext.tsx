"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  interests: string[];
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (interests: string[]) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedToken = localStorage.getItem('wandermind_token');
    const storedUser = localStorage.getItem('wandermind_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setToken(response.access_token);
      setUser(response.user);
      
      localStorage.setItem('wandermind_token', response.access_token);
      localStorage.setItem('wandermind_user', JSON.stringify(response.user));
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle Pydantic validation errors (422)
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // If detail is an array (Pydantic validation errors)
        if (Array.isArray(detail)) {
          const errorMessages = detail.map((err: any) => {
            const field = err.loc?.[1] || err.loc?.[0] || 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(errorMessages);
        }
        
        // If detail is a string
        throw new Error(detail);
      }
      
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await api.signup(email, password, name);
      setToken(response.access_token);
      setUser(response.user);
      
      localStorage.setItem('wandermind_token', response.access_token);
      localStorage.setItem('wandermind_user', JSON.stringify(response.user));
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle Pydantic validation errors (422)
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // If detail is an array (Pydantic validation errors)
        if (Array.isArray(detail)) {
          const errorMessages = detail.map((err: any) => {
            const field = err.loc?.[1] || err.loc?.[0] || 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(errorMessages);
        }
        
        // If detail is a string
        throw new Error(detail);
      }
      
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wandermind_token');
    localStorage.removeItem('wandermind_user');
    localStorage.removeItem('wandermind_session');
  };

  const updatePreferences = async (interests: string[]) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      await api.updatePreferences(interests, token);
      if (user) {
        const updatedUser = { ...user, interests };
        setUser(updatedUser);
        localStorage.setItem('wandermind_user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update preferences');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        updatePreferences,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
