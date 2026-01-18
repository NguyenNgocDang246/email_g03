import API from "./baseAPI";
import axios from "axios";

export interface KanbanColumn {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  position: number;
  isLocked?: boolean;
}

export const getKanbanColumns = async (): Promise<KanbanColumn[]> => {
  try {
    const res = await API.get("/kanban/columns");
    return res.data as KanbanColumn[];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const createKanbanColumn = async (payload: {
  displayName: string;
  description?: string;
}): Promise<KanbanColumn> => {
  try {
    const res = await API.post("/kanban/columns", payload);
    return res.data as KanbanColumn;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const updateKanbanColumn = async (
  id: string,
  payload: { displayName?: string; description?: string }
): Promise<KanbanColumn> => {
  try {
    const res = await API.patch(`/kanban/columns/${id}`, payload);
    return res.data as KanbanColumn;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const deleteKanbanColumn = async (id: string): Promise<void> => {
  try {
    await API.delete(`/kanban/columns/${id}`);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};

export const reorderKanbanColumns = async (
  order: string[]
): Promise<KanbanColumn[]> => {
  try {
    const res = await API.patch(`/kanban/columns/reorder`, { order });
    return res.data as KanbanColumn[];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Request error");
    }
    throw new Error("Unexpected error");
  }
};
