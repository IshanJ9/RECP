import { create } from 'zustand';

export interface User {
  userWallet: string;
  userName: string;
  name: string;
  userProfile: string;
}

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  
  setCurrentUser: (user) => {
    set({ currentUser: user });
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },
  
  clearUser: () => {
    set({ currentUser: null });
    localStorage.removeItem('currentUser');
  },
  
  isAuthenticated: () => {
    const { currentUser } = get();
    return currentUser !== null;
  },
}));

// Initialize user from localStorage on app load
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      useUserStore.getState().setCurrentUser(user);
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('currentUser');
    }
  }
}
