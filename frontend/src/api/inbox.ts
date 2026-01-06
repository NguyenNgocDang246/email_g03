import API from "./baseAPI";
import axios from "axios";
import { type KanbanStatus } from "../constants/kanban";

export interface MailBoxesInfo {
  id: string;
  name: string;
  messageListVisibility: string;
  labelListVisibility: string;
  type: string;
}

export const getMailBoxesInfo = async (): Promise<MailBoxesInfo[]> => {
  try {
    const res = await API.get("/mailboxes");
    console.log(res.data)
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface MailInfo {
  id: string;
  mailboxId: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean; // API không có -> default false
  body: string; // API không có -> để rỗng
  labels?: string[];
  status?: KanbanStatus;
  hasAttachments:boolean;
}

export interface MailListResponse {
  nextPageToken: string | null;
  total: number;
  data: MailInfo[];
}

interface MailListApiItem {
  id: string;
  mailboxId: string;
  from: string;
  subject?: string;
  snippet?: string;
  date: string;
  isRead: boolean;
  labels?: string[];
  body?: string;
  status?: KanbanStatus;
  hasAttachments:boolean;
}

interface MailListApiResponse {
  nextPageToken: string | null;
  total: number;
  data: MailListApiItem[];
}

export const getMailBoxesEmailListInfo = async (
  mailboxId: string,
  query?: string,
  pageToken?: string
): Promise<MailListResponse> => {
  try {
    const url = query
      ? `/mailboxes/${mailboxId}/emails/search?query=${encodeURIComponent(
          query
        )}&limit=10&pageToken=${pageToken || ""}`
      : `/mailboxes/${mailboxId}/emails?limit=10&pageToken=${pageToken || ""}`;


    const res = await API.get(url);

    const { nextPageToken, total, data } = res.data as MailListApiResponse;
    console.log("danh sahc mail",data)

    const mappedData: MailInfo[] = data.map((item) => ({
      id: item.id,
      mailboxId: item.mailboxId,
      from: item.from,
      subject: item.subject || "",
      preview: item.snippet || "",
      timestamp: item.date,
      isRead: item.isRead,
      isStarred: item.labels?.includes("STARRED") || false,
      body: item.body || "",
      labels: item.labels,
      status: (item.status as KanbanStatus) || "INBOX",
      hasAttachments: item.hasAttachments,
    }));

    return {
      nextPageToken,
      total,
      data: mappedData,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface MailAddress {
  name?: string; // từ response có thể không có fromName
  email: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface MailDetail {
  id: string;
  threadId: string;
  mailboxId: string;

  sender: MailAddress;
  recipients: MailAddress[];

  subject: string;
  snippet?: string;
  bodyHtml: string;
  bodyText?: string;
  date: string; // ISO string
  messageIdHeader?: string;

  isRead?: boolean;
  hasAttachments?: boolean;
  labels?: string[];
  status?: KanbanStatus;

  attachments?: Attachment[];
}

interface AttachmentResponse {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}

interface MailDetailResponse {
  id: string;
  threadId: string;
  mailboxId: string;
  from: string;
  fromName?: string;
  to: string[];
  subject: string;
  snippet?: string;
  bodyHtml: string;
  bodyText?: string;
  date: string;
  messageIdHeader?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  labels?: string[];
  status?: KanbanStatus;
  attachments?: AttachmentResponse[];
}

export const getEmailDetail = async (emailId: string): Promise<MailDetail> => {
  try {
    const res = await API.get(`/emails/${emailId}`);
    const data = res.data as MailDetailResponse;

    const mailDetail: MailDetail = {
      id: data.id,
      threadId: data.threadId,
      mailboxId: data.mailboxId,
      sender: {
        email: data.from,
        name: data.fromName,
      },
      recipients: data.to.map((email: string) => ({ email })), // nếu chỉ có email, không có tên
      subject: data.subject,
      snippet: data.snippet,
      bodyHtml: data.bodyHtml,
      bodyText: data.bodyText,
      date: data.date,
      messageIdHeader: data.messageIdHeader,
      isRead: data.isRead,
      hasAttachments: data.hasAttachments,
      labels: data.labels,
      status: (data.status as KanbanStatus) || "INBOX",
      attachments: data.attachments?.map((att) => ({
        id: att.id,
        filename: att.fileName,
        mimeType: att.mimeType,
        size: att.size,
      })),
    };


    return mailDetail;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface ModifyEmailPayload {
  isStar?: boolean;
  isRead?: boolean;
  isDelete?: boolean;
  addLabels?: string[];
  removeLabels?: string[];
}

export const modifyEmail = async (
  emailId: string,
  payload: ModifyEmailPayload
): Promise<void> => {
  try {
    // console.log("payload: ",payload);
    await API.post(`/emails/${emailId}/modify`, payload);
    // console.log(res);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const updateEmailStatus = async (
  emailId: string,
  status: KanbanStatus,
  options?: { snoozedUntil?: string; previousStatus?: KanbanStatus }
): Promise<void> => {
  await API.post(`/emails/${emailId}/status`, { status, ...options });
};

export interface SendEmailPayload {
  to: string; 
  subject: string; 
  html: string; 
}

export interface SendEmailResponse {
  message: string;
  id: string; 
}


export const sendEmail = async (
  payload: SendEmailPayload
): Promise<SendEmailResponse> => {
  try {
    const res = await API.post("/emails/send", payload);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export interface ReplyEmailPayload {
  to: string; 
  subject?: string;
  html: string;
}

export interface ReplyEmailResponse {
  message: string; 
  id: string; 
}

export const replyEmail = async (
  emailId: string,
  payload: ReplyEmailPayload
): Promise<ReplyEmailResponse> => {
  try {
    const res = await API.post(`/emails/${emailId}/reply`, payload);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};
