import API from "./baseAPI";
import axios from "axios";

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
}

export interface MailListResponse {
  nextPageToken: string | null;
  total: number;
  data: MailInfo[];
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

    const { nextPageToken, total, data } = res.data;

    const mappedData: MailInfo[] = data.map((item: any) => ({
      id: item.id,
      mailboxId: item.mailboxId,
      from: item.from,
      subject: item.subject || "",
      preview: item.snippet || "",
      timestamp: item.date,
      isRead: item.isRead,
      isStarred: item.labels?.includes("STARRED") || false,
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

  attachments?: Attachment[];
}

export const getEmailDetail = async (emailId: string): Promise<MailDetail> => {
  try {
    const res = await API.get(`/emails/${emailId}`);
    const data = res.data;

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
      attachments: data.attachments?.map((att: any) => ({
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
}

export const modifyEmail = async (
  emailId: string,
  payload: ModifyEmailPayload
): Promise<void> => {
  try {
    await API.post(`/emails/${emailId}/modify`, payload);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
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
