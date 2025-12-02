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

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Nếu 401, gọi refresh token API
    if (error.response?.status === 401) {
      try {
        await refreshAxios.get(`${backendURL}/token/refresh`);
        // cookie access token mới sẽ được gửi tự động
        return API(error.config); // retry request
      } catch {
        // logout hoặc redirect login
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
