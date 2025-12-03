import API from "./baseAPI"; // Axios instance đã gắn interceptor tự động
import axios from "axios";

export interface RegisterData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  try {
    const res = await API.post("/auth/register", data);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface LoginData {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginData) => {
  try {
    const res = await API.post("/auth/login", data);
    return res.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const loginWithGoogle = async () => {
  try {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
  }
};

export const logoutUser = async () => {
  try {
    await API.get("/auth/logout");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
  }
};

// export const loginWithGoogle = async (credentialResponse: CredentialResponse) => {
//   try {
//     const credential = credentialResponse.credential;
//     if (!credential) throw new Error("No Google credential");

//     const res = await API.post("/user/google", { credential });

//     return res.data.data;
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error)) {
//       throw new Error(error.response?.data?.message || "Request error");
//     }
//     throw new Error("Unexpected error");
//   }
// };

export interface UserInfo {
  _id: string;
  email: string;
}

export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const res = await API.get("/user/info");
    return res.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};
