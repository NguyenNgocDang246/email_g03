import API from "./baseAPI";
import axios from "axios";

export interface MailBoxesInfo {
  id: string;
  name: string;
  unreadCount: number;
}

export const getMailBoxesInfo = async (): Promise<MailBoxesInfo[]> => {
  try {
    const res = await API.get("/mailboxes");
    console.log(res.data);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};


export interface MailInfo{
  
}