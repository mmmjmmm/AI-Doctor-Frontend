/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";
import type { TaskContext } from "@/types/task";
import type { Message } from "@/types/chat";

export interface SendMessageRequest {
  session_id: string;
  client_message_id: string;
  content: string;
  task_context?: TaskContext;
  attachment_ids?: string[];
}

export interface SendMessageResponse {
  user_message_id?: string;
  user_message?: Message;
  assistant_message_id: string;
  stream: {
    protocol: "sse";
    stream_url: string;
  };
}

export interface StopMessageRequest {
  session_id: string;
  assistant_message_id: string;
}

export const sendMessage = async (payload: SendMessageRequest) => {
  const response = await request.post<any, SendMessageResponse>(
    "/message/send",
    payload,
  );
  return response;
};

export const stopMessage = async (payload: StopMessageRequest) => {
  const response = await request.post<any, { ok: boolean }>(
    "/message/stop",
    payload,
  );
  return response;
};
