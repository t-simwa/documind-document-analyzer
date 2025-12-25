// Authentication Store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  hasRole: (role: 'admin' | 'analyst' | 'viewer') => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      clearAuth: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
      
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        // For MVP: is_superuser = admin, others = analyst/viewer
        if (role === 'admin') {
          return user.is_superuser === true;
        }
        // For MVP, all authenticated users can be analyst/viewer
        return user.is_active === true;
      },
      
      isAdmin: () => {
        const { user } = get();
        return user?.is_superuser === true;
      },
    }),
    {
      name: 'documind-auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

