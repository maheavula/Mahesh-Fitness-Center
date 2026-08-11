import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MemberProfile, MemberSubscription } from '../types/index.js';
import { apiClient } from '../services/apiClient.js';

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  subscription: MemberSubscription | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  signup: (payload: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [subscription, setSubscription] = useState<MemberSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setProfile(res.data.profile || null);
        setSubscription(res.data.subscription || null);
      } else {
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
    } catch (_) {
      setUser(null);
      setProfile(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    const res = await apiClient.login(credentials);
    if (res.success && res.data) {
      setUser(res.data.user);
      setProfile(res.data.profile || null);
      await refreshUser();
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return {
        success: false,
        error: res.error?.message || 'Login failed'
      };
    }
  };

  const signup = async (payload: any) => {
    setIsLoading(true);
    const res = await apiClient.signup(payload);
    if (res.success && res.data) {
      setUser(res.data.user);
      setProfile(res.data.profile || null);
      await refreshUser();
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return {
        success: false,
        error: res.error?.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await apiClient.logout();
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, subscription, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
