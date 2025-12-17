import axios from "axios";
import API from "./baseAPI";
import { type KanbanStatus } from "../constants/kanban";
import type { MailInfo } from "./inbox";

export interface SemanticSearchPayload {
  query: string;
  mailboxId?: string;
  limit?: number;
}

export interface SemanticSearchResult extends MailInfo {
  score?: number;
}

export interface SemanticSearchResponse {
  data: SemanticSearchResult[];
}

export interface SummaryResponse {
  summary: string;
  metadata?: Record<string, unknown>;
  fullText?: string;
  status?: KanbanStatus;
}

export const semanticSearchEmails = async (
  payload: SemanticSearchPayload
): Promise<SemanticSearchResult[]> => {
  try {
    const res = await API.post<SemanticSearchResponse>("/ai/search", payload);
    return (res.data?.data ?? []).map((item) => ({
      ...item,
      status: (item.status as KanbanStatus) || "INBOX",
    }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Semantic search failed");
    }
    throw new Error("Unexpected semantic search error");
  }
};

export const summarizeEmail = async (
  emailId: string,
  refresh = false
): Promise<SummaryResponse> => {
  try {
    const res = await API.post<SummaryResponse>(
      `/ai/emails/${emailId}/summarize`,
      undefined,
      refresh ? { params: { refresh: true } } : undefined
    );
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Summary failed");
    }
    throw new Error("Unexpected summary error");
  }
};
