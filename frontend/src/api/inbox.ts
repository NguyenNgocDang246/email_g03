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
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface MailInfo {
  id: number;
  mailboxId: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  body: string;
}

export const getMailBoxesEmailListInfo = async (
  mailboxId: string,
  query?: string
): Promise<MailInfo[]> => {
  try {
    // Nếu có query thì thêm /search?query=
    const url = query
      ? `/mailboxes/${mailboxId}/emails/search?query=${encodeURIComponent(query)}`
      : `/mailboxes/${mailboxId}/emails`;

    const res = await API.get(url);
    return res.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface MailAddress {
  name: string;
  email: string;
}

export interface Attachment {
  id?: number;
  fileName: string;
  url: string;
  size?: number; // optional
}

export interface MailDetail {
  id: number;
  mailboxId: string;

  sender: MailAddress;
  recipients: MailAddress[];

  subject: string;
  body: string; // HTML
  timestamp: string; // ISO string

  isRead?: boolean;
  isStarred?: boolean;

  attachments?: Attachment[];
}

export const getEmailDetail = async (emailId: number): Promise<MailDetail> => {
  try {
    const res = await API.get(`/emails/${emailId}`);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};