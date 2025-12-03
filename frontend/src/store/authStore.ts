import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  seoCredits: number;
  reelCredits: number;
  subscription?: any;
  tryoutStartDate?: string;
  tryoutEndDate?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateCredits: (seoCredits: number, reelCredits: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await authApi.login({ email, password });
      console.log('✅ Login successful:', response.data);
      const { accessToken, refreshToken, user } = response.data;

      Cookies.set('accessToken', accessToken);
      Cookies.set('refreshToken', refreshToken);

      set({ user, isAuthenticated: true });
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  register: async (data: any) => {
    try {
      await authApi.register(data);
      toast.success('Registration successful! Please login.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    }
  },

  fetchUser: async () => {
    const token = Cookies.get('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateCredits: (seoCredits: number, reelCredits: number) => {
    set((state) => ({
      user: state.user
        ? { ...state.user, seoCredits, reelCredits }
        : null,
    }));
  },
}));

