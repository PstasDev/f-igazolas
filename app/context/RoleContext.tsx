'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Profile } from '@/lib/types';

export type UserRole = 'student' | 'teacher';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
  class?: string; // For students
  profile?: Profile;
}

interface RoleContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle authentication errors - logout and redirect
  const handleAuthError = () => {
    setUser(null);
    if (pathname !== '/login') {
      router.push('/login');
    }
  };

  // Set up auth error handler on mount
  useEffect(() => {
    apiClient.setAuthErrorHandler(handleAuthError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch and set user profile
  const fetchUserProfile = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const profile = await apiClient.getMyProfile();
      
      // Determine user role based on profile
      // Check if user is an osztályfőnök (teacher)
      const isTeacher = profile.osztalyom 
        ? await checkIfTeacher(profile.user.id, profile.osztalyom.id)
        : false;

      const lastInitial = profile.user.last_name?.trim().charAt(0) || '';
      const firstInitial = profile.user.first_name?.trim().charAt(0) || '';
      const avatarSeed = lastInitial && firstInitial ? `${lastInitial}${firstInitial}` : profile.user.username;

      const userData: User = {
        id: profile.user.id,
        name: `${profile.user.last_name || ''} ${profile.user.first_name || ''}`.trim() || profile.user.username,
        email: profile.user.email || '',
        username: profile.user.username,
        role: isTeacher ? 'teacher' : 'student',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`,
        class: profile.osztalyom?.nev,
        profile,
      };

      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
      apiClient.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if user is a teacher (osztályfőnök)
  const checkIfTeacher = async (userId: number, osztalyId: number): Promise<boolean> => {
    try {
      const osztaly = await apiClient.getOsztaly(osztalyId);
      return osztaly.osztalyfonokok.some(of => of.id === userId);
    } catch (error) {
      console.error('Failed to check teacher status:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check for JWT token and fetch profile on mount only
    const initAuth = async () => {
      await fetchUserProfile();
    };
    
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Call Django login endpoint
      await apiClient.login({ username, password });
      
      // Token is already stored in cookies by apiClient
      // Now fetch the user profile
      await fetchUserProfile();
    } catch (error) {
      console.error('Login failed:', error);
      
      // Check if the error is 401 (unauthorized) and username looks like an email
      const isUnauthorized = (error as { status?: number })?.status === 401;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailFormat = emailRegex.test(username);
      
      if (isUnauthorized && isEmailFormat) {
        try {
          // Extract username part before @ and retry
          const extractedUsername = username.split('@')[0];
          await apiClient.login({ username: extractedUsername, password });
          
          // Token is already stored in cookies by apiClient
          // Now fetch the user profile
          await fetchUserProfile();
          return; // Success on retry
        } catch (retryError) {
          console.error('Login retry failed:', retryError);
          // Throw the retry error (this will be the final error shown to user)
          throw retryError;
        }
      } else {
        // Not an email format or different error, throw original error
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    await fetchUserProfile();
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
