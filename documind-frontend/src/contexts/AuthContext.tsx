// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, tokenStorage, User, TokenResponse } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (tokenStorage.hasTokens()) {
        try {
          const response = await authApi.getMe();
          setUser(response.user);
        } catch (error) {
          console.error("Failed to get user info:", error);
          tokenStorage.clearTokens();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const tokens = await authApi.login({ email, password });
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      
      // Get user info
      const userResponse = await authApi.getMe();
      setUser(userResponse.user);
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
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      tokenStorage.clearTokens();
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

