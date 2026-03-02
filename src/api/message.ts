/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";

export interface SendMessageRequest {
  session_id: string;
  client_message_id: string;
  content: string;
}

export interface SendMessageResponse {
  user_message_id: string;
  assistant_message_id: string;
  stream: {
    protocol: "sse";
    stream_url: string;
  };
}

export const sendMessage = async (payload: SendMessageRequest) => {
  const response = await request.post<any, SendMessageResponse>(
    "/message/send",
    payload,
  );
  return response;
};
