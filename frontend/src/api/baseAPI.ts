import axios from "axios";

// Axios instance
const backendURL = import.meta.env.VITE_BACKEND_URL;
const API = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});
const refreshAxios = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

const subscribeTokenRefresh = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshComplete = (success: boolean) => {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Nếu đang refresh, đợi kết quả
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((success) => {
            if (success) {
              resolve(API(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      // Bắt đầu refresh
      isRefreshing = true;

      try {
        await refreshAxios.get(`${backendURL}/token/refresh`);
        isRefreshing = false;
        onRefreshComplete(true);
        return API(originalRequest);
      } catch {
        isRefreshing = false;
        onRefreshComplete(false);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
