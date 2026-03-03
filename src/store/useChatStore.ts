import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Message } from "@/types/chat";

interface ChatState {
  activeSessionId: string | null;
  messagesBySession: Record<string, Message[]>;
  generatingBySession: Record<string, boolean>;
  streamingMessageIdBySession: Record<string, string | null>;
}

interface ChatActions {
  setActiveSessionId: (sessionId: string | null) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (
    sessionId: string,
    messageId: string,
    updater: (msg: Message) => void,
  ) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  clearMessages: (sessionId: string) => void;
  setSessionGenerating: (sessionId: string, isGenerating: boolean) => void;
  setStreamingMessageId: (
    sessionId: string,
    messageId: string | null,
  ) => void;
  interruptAssistantMessage: (sessionId: string, messageId: string) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  immer((set) => ({
    activeSessionId: null,
    messagesBySession: {},
    generatingBySession: {},
    streamingMessageIdBySession: {},

    setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),

    setMessages: (sessionId, messages) =>
      set((state) => {
        state.messagesBySession[sessionId] = messages;
      }),

    addMessage: (sessionId, message) =>
      set((state) => {
        if (!state.messagesBySession[sessionId]) {
          state.messagesBySession[sessionId] = [];
        }
        state.messagesBySession[sessionId].push(message);
      }),

    updateMessage: (sessionId, messageId, updater) =>
      set((state) => {
        const messages = state.messagesBySession[sessionId];
        if (messages) {
          const msg = messages.find((m) => m.message_id === messageId);
          if (msg) {
            updater(msg);
          }
        }
      }),

    removeMessage: (sessionId, messageId) =>
      set((state) => {
        const messages = state.messagesBySession[sessionId];
        if (!messages) return;

        state.messagesBySession[sessionId] = messages.filter(
          (m) => m.message_id !== messageId,
        );
      }),

    clearMessages: (sessionId) =>
      set((state) => {
        delete state.messagesBySession[sessionId];
        delete state.generatingBySession[sessionId];
        delete state.streamingMessageIdBySession[sessionId];
      }),

    setSessionGenerating: (sessionId, isGenerating) =>
      set((state) => {
        if (isGenerating) {
          state.generatingBySession[sessionId] = true;
        } else {
          delete state.generatingBySession[sessionId];
        }
      }),

    setStreamingMessageId: (sessionId, messageId) =>
      set((state) => {
        if (messageId) {
          state.streamingMessageIdBySession[sessionId] = messageId;
        } else {
          delete state.streamingMessageIdBySession[sessionId];
        }
      }),

    interruptAssistantMessage: (sessionId, messageId) =>
      set((state) => {
        const messages = state.messagesBySession[sessionId];
        if (!messages) return;

        const msg = messages.find(
          (m) => m.message_id === messageId && m.role === "assistant",
        );
        if (!msg) return;

        msg.status = "interrupted";
        msg.thinking_status = "done";
        if (!msg.error_message) {
          msg.error_message = "已停止生成";
        }

        delete state.generatingBySession[sessionId];
        if (state.streamingMessageIdBySession[sessionId] === messageId) {
          delete state.streamingMessageIdBySession[sessionId];
        }
      }),
  })),
);
