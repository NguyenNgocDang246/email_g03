import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
// Lưu access token trong memory
export let accessTokenMemory: string | null = null;

// Axios instance
const API = axios.create({
  baseURL: "http://localhost:3000",
});

// Hàm set access token ban đầu (sau login)
export const setAccessToken = (token: string | null) => {
  accessTokenMemory = token;
};

// Hàm refresh token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await axios.post("http://localhost:3000/token/refresh", {
    refreshToken,
  });

  const newAccessToken = res.data.accessToken;
  const newRefreshToken = res.data.refreshToken;

  // Cập nhật access token trong memory
  accessTokenMemory = newAccessToken;

  // Lưu refresh token mới
  localStorage.setItem("refreshToken", newRefreshToken);

  return newAccessToken;
};

// Interceptor request: gắn access token
API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessTokenMemory && config.headers) {
    config.headers.Authorization = `Bearer ${accessTokenMemory}`;
  }
  return config;
});

// Interceptor response: nếu 401, gọi refresh và retry
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { config?: any }) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return API(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại
        accessTokenMemory = null;
        localStorage.removeItem("refreshToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
