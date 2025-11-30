import {
  loginUser,
  loginWithGoogle,
  getUserInfo,
  type LoginData,
  type UserInfo,
} from "../api/user";
import { setAccessToken } from "../api/baseAPI";
import { create } from "zustand";

interface AuthState {
  user: UserInfo|null;
  isLoading: boolean;
  isAuthenticated:boolean;

  login:(data:LoginData)=>Promise<void>;
  loginGoogle: (Credential:any)=>Promise<void>;
  fetchUser:()=>Promise<void>;
  logout:()=>void;
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


  loginGoogle: async (credential) => {
    set({ isLoading: true });
    try {
      const res = await loginWithGoogle(credential);

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

 
  logout: () => {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    setAccessToken("");

    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));