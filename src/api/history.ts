/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";
import type { Session, Message } from "@/types/chat";

export interface HistorySessionItem {
  session_id: string;
  title: string;
  last_message: string;
  last_time: string;
  has_image: boolean;
}

export interface HistoryListResponse {
  sessions: HistorySessionItem[];
  cursor: string;
  has_more: boolean;
}

export interface HistoryDetailResponse {
  session: Session;
  messages: Message[];
  disclaimer: {
    top_bar: string;
    bottom_hint: string;
  };
}

export const getHistoryList = async (params: {
  days?: number;
  cursor?: string;
  limit?: number;
}) => {
  const response = await request.get<any, HistoryListResponse>(
    "/history/list",
    {
      params,
    },
  );
  return response;
};

export const getHistoryDetail = async (session_id: string) => {
  const response = await request.get<any, HistoryDetailResponse>(
    "/history/detail",
    {
      params: { session_id },
    },
  );
  return response;
};

export const deleteHistory = async (session_id: string) => {
  const response = await request.post<any, { ok: boolean }>("/history/delete", {
    session_id,
  });
  return response;
};

export const batchDeleteHistory = async (
  session_ids: string[],
  mode: "delete" = "delete",
) => {
  const response = await request.post<
    any,
    { deleted: string[]; failed: string[] }
  >("/history/batch_delete", {
    session_ids,
    mode,
  });
  return response;
};
