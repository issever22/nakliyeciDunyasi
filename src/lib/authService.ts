// This is a mock authentication service.
// In a real application, integrate with a proper backend authentication system.
import type { UserProfile } from '@/types';

const USER_STORAGE_KEY = 'nakliyeci-dunyasi-user';

export const authService = {
  login: async (email: string, _pass: string): Promise<UserProfile | null> => {
    // Mock login: In a real app, call your backend API
    // For demo, assume login is successful if email is not empty
    if (email) {
      const user: UserProfile = {
        id: 'user-' + Date.now(),
        email: email,
        name: email.split('@')[0] || 'Kullanıcı', // Simple name generation
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    }
    return null;
  },

  register: async (name: string, email: string, _pass: string): Promise<UserProfile | null> => {
    // Mock registration
    if (name && email) {
      const user: UserProfile = {
        id: 'user-' + Date.now(),
        email: email,
        name: name,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    }
    return null;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  getCurrentUser: (): UserProfile | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr) as UserProfile;
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          localStorage.removeItem(USER_STORAGE_KEY);
          return null;
        }
      }
    }
    return null;
  },
};
