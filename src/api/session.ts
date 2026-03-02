/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";
import type { Session, Message } from "@/types/chat";

export interface CreateSessionResponse {
  session: Session;
  welcome_messages: Message[];
  disclaimer: {
    top_bar: string;
    bottom_hint: string;
  };
}

export const createSession = async (entry_source: string = "direct") => {
  const response = await request.post<any, CreateSessionResponse>(
    "/session/create",
    {
      entry_source,
    },
  );
  return response;
};

export const endSession = async (session_id: string) => {
  const response = await request.post<any, { ok: boolean }>("/session/end", {
    session_id,
  });
  return response;
};
