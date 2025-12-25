// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, tokenStorage, User, TokenResponse } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync local state with Zustand store
  useEffect(() => {
    if (user) {
      useAuthStore.getState().setUser(user);
    }
  }, [user]);

  useEffect(() => {
    useAuthStore.getState().setLoading(isLoading);
  }, [isLoading]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (tokenStorage.hasTokens()) {
        try {
          const response = await authApi.getMe();
          setUser(response.user);
          useAuthStore.getState().setUser(response.user);
        } catch (error) {
          console.error("Failed to get user info:", error);
          tokenStorage.clearTokens();
          useAuthStore.getState().clearAuth();
        }
      }
      setIsLoading(false);
      useAuthStore.getState().setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const tokens = await authApi.login({ email, password, remember_me: rememberMe });
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      
      // Get user info
      const userResponse = await authApi.getMe();
      setUser(userResponse.user);
      useAuthStore.getState().setUser(userResponse.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      const tokens = await authApi.register({ email, name, password });
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      
      // Get user info
      const userResponse = await authApi.getMe();
      setUser(userResponse.user);
      useAuthStore.getState().setUser(userResponse.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      tokenStorage.clearTokens();
      useAuthStore.getState().clearAuth();
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      console.log("AuthContext: Refreshed user data:", response.user);
      console.log("AuthContext: organization_id value:", response.user?.organization_id);
      console.log("AuthContext: organization_id type:", typeof response.user?.organization_id);
      setUser(response.user);
      useAuthStore.getState().setUser(response.user);
      return response.user;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      tokenStorage.clearTokens();
      useAuthStore.getState().clearAuth();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

