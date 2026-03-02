import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Message } from "@/types/chat";

interface ChatState {
  activeSessionId: string | null;
  messagesBySession: Record<string, Message[]>;
  isGenerating: boolean;
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
  clearMessages: (sessionId: string) => void;
  setGenerating: (isGenerating: boolean) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  immer((set) => ({
    activeSessionId: null,
    messagesBySession: {},
    isGenerating: false,

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

    clearMessages: (sessionId) =>
      set((state) => {
        delete state.messagesBySession[sessionId];
      }),

    setGenerating: (isGenerating) =>
      set((state) => {
        state.isGenerating = isGenerating;
      }),
  })),
);
