import API, { setAccessToken } from "./baseAPI"; // Axios instance đã gắn interceptor tự động
import axios from "axios";
import type { CredentialResponse } from "@react-oauth/google";

export interface RegisterData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  try {
    const res = await API.post("/user/register", data);
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
    const res = await API.post("/user/login", data);

    // Lưu access token vào memory trong baseAPI
    setAccessToken(res.data.accessToken);

    // Lưu refresh token vào localStorage
    localStorage.setItem("refreshToken", res.data.refreshToken);

    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const loginWithGoogle = async (credentialResponse: CredentialResponse) => {
  try {
    const credential = credentialResponse.credential;
    if (!credential) throw new Error("No Google credential");

    const res = await API.post("/user/google", { credential });

    // Lưu access token vào memory (baseAPI)
    setAccessToken(res.data.data.accessToken);

    // Lưu refresh token vào localStorage
    localStorage.setItem("refreshToken", res.data.data.refreshToken);

    return res.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface UserInfo {
  _id: string;
  email: string;
}

export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const res = await API.get("/user/info");
    console.log(res.data.data);
    return res.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};
