import {
  loginUser,
  loginWithGoogle,
  getUserInfo,
  logoutUser,
  type LoginData,
  type UserInfo,
} from "../api/user";
import { create } from "zustand";

interface AuthState {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginData) => Promise<void>;
  loginGoogle: (Credential: any) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (data) => {
    set({ isLoading: true });
    try {
      const res = await loginUser(data);

      set({
        isAuthenticated: true,
        user: res,
      });
    } catch (err) {
      set({ isAuthenticated: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  loginGoogle: async () => {
    try {
      await loginWithGoogle();
    } catch (error: unknown) {
      console.error(error);
    }
  },

  fetchUser: async () => {
    try {
      const userInfo = await getUserInfo();
      set({
        user: userInfo,
        isAuthenticated: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    await logoutUser();
    window.location.href = "/";
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));