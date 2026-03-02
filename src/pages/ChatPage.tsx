import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Toast } from "antd-mobile";
import TopNavBar from "@/components/TopNavBar";
import DisclaimerTopBar from "@/components/DisclaimerTopBar";
import BottomToolsBar from "@/components/BottomToolsBar";
import Composer from "@/components/Composer";
import HistoryDrawer from "@/components/HistoryDrawer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAppConfig } from "@/api/app";
import { createSession } from "@/api/session";
import { getHistoryDetail } from "@/api/history";
import { sendMessage } from "@/api/message";
import { useChatStore } from "@/store/useChatStore";
import { useAppStore } from "@/store/useAppStore";
import type { Message } from "@/types/chat";

export default function ChatPage() {
  const [historyVisible, setHistoryVisible] = useState(false);
  const justCreatedSessionIdRef = useRef<string | null>(null);
  const streamMapRef = useRef<Record<string, EventSource>>({});

  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const historyNavNonce =
    (
      location.state as {
        historyNavNonce?: number;
      } | null
    )?.historyNavNonce ?? null;

  const { config, setConfig } = useAppStore();
  const {
    activeSessionId,
    messagesBySession,
    setActiveSessionId,
    setMessages,
    addMessage,
    updateMessage,
    isGenerating,
    setGenerating,
  } = useChatStore();

  const messages = activeSessionId
    ? messagesBySession[activeSessionId] || []
    : [];

  // 1. 获取 App 配置
  const { data: appConfig } = useQuery({
    queryKey: ["appConfig"],
    queryFn: getAppConfig,
  });

  useEffect(() => {
    if (appConfig) {
      setConfig(appConfig);
    }
  }, [appConfig, setConfig]);

  // 2. 加载会话详情 (如果 URL 中有 sessionId)
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["historyDetail", sessionId, historyNavNonce ?? location.key],
    queryFn: async () => {
      if (!sessionId) return null;
      const data = await getHistoryDetail(sessionId);
      return data;
    },
    enabled: !!sessionId && sessionId !== justCreatedSessionIdRef.current,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  // 监听 sessionId 变化，更新 activeSessionId
  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
    } else {
      // 如果 URL 没有 sessionId，但有 activeSessionId，说明是从会话页切回主页，或初始化
      // 如果当前不是正在创建会话，则清空 activeSessionId
      if (activeSessionId && activeSessionId !== sessionId) {
        if (
          justCreatedSessionIdRef.current &&
          activeSessionId === justCreatedSessionIdRef.current
        ) {
          return;
        }
        setActiveSessionId(null);
      }
    }
  }, [sessionId, setActiveSessionId, activeSessionId]);

  // 监听 historyData 变化，更新消息到 Store
  useEffect(() => {
    if (
      historyData &&
      sessionId &&
      sessionId !== justCreatedSessionIdRef.current
    ) {
      setMessages(sessionId, historyData.messages);
    }
  }, [historyData, sessionId, setMessages]);

  // 3. 创建会话 Mutation
  const { mutate: initSession, isPending: isCreatingSession } = useMutation({
    mutationFn: () => createSession(),
    onSuccess: (data) => {
      const { session, welcome_messages } = data;
      justCreatedSessionIdRef.current = session.session_id;

      // 1. 更新 Store
      setActiveSessionId(session.session_id);
      setMessages(session.session_id, welcome_messages);

      Toast.show({
        content: "已开始新会话",
        icon: "success",
      });
      // 更新 URL 到新会话
      navigate(`/chat/${session.session_id}`, { replace: true });
    },
    onError: () => {
      Toast.show({
        content: "会话创建失败",
        icon: "fail",
      });
    },
  });

  // 4. 初始化：如果无 URL sessionId 且无 activeSessionId，自动创建
  useEffect(() => {
    if (!sessionId && !activeSessionId && !isCreatingSession) {
      initSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // 依赖项里去掉 activeSessionId，避免死循环，只在挂载或 sessionId 变化时检查

  useEffect(() => {
    return () => {
      const streams = streamMapRef.current;
      Object.keys(streams).forEach((key) => {
        streams[key]?.close();
        delete streams[key];
      });
    };
  }, []);

  useEffect(() => {
    const streams = streamMapRef.current;
    Object.keys(streams).forEach((key) => {
      streams[key]?.close();
      delete streams[key];
    });
  }, [activeSessionId]);

  const { mutateAsync: sendMessageAsync } = useMutation({
    mutationFn: sendMessage,
  });

  const handleSend = async (text: string) => {
    if (!activeSessionId) return;
    const currentSessionId = activeSessionId;

    const now = new Date().toISOString();
    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    addMessage(currentSessionId, {
      message_id: clientMessageId,
      session_id: currentSessionId,
      role: "user",
      type: "text",
      content: text,
      created_at: now,
      status: "sending",
    });

    setGenerating(true);

    try {
      const resp = await sendMessageAsync({
        session_id: currentSessionId,
        client_message_id: clientMessageId,
        content: text,
      });

      updateMessage(currentSessionId, clientMessageId, (msg) => {
        msg.status = "sent";
      });

      const assistantMessageId = resp.assistant_message_id;
      let hasAddedAssistantMsg = false;

      const existed = streamMapRef.current[assistantMessageId];
      if (existed) {
        existed.close();
        delete streamMapRef.current[assistantMessageId];
      }

      const es = new EventSource(resp.stream.stream_url);
      streamMapRef.current[assistantMessageId] = es;

      const closeStream = () => {
        const stream = streamMapRef.current[assistantMessageId];
        if (stream) {
          stream.close();
          delete streamMapRef.current[assistantMessageId];
        }
        setGenerating(false);
      };

      es.addEventListener("delta", (evt) => {
        const e = evt as MessageEvent<string>;
        if (!e.data) return;
        try {
          const payload = JSON.parse(e.data) as {
            message_id: string;
            text: string;
          };
          if (payload.message_id !== assistantMessageId) return;
          if (!payload.text) return;

          if (!hasAddedAssistantMsg) {
            addMessage(currentSessionId, {
              message_id: assistantMessageId,
              session_id: currentSessionId,
              role: "assistant",
              type: "text",
              content: payload.text,
              created_at: new Date().toISOString(),
              status: "sending",
              feedback_status: "none",
            });
            hasAddedAssistantMsg = true;
          } else {
            updateMessage(currentSessionId, assistantMessageId, (msg) => {
              msg.content = (msg.content || "") + payload.text;
            });
          }
        } catch {
          return;
        }
      });

      es.addEventListener("done", (evt) => {
        const e = evt as MessageEvent<string>;
        if (!e.data) {
          closeStream();
          return;
        }

        try {
          const payload = JSON.parse(e.data) as {
            final: {
              message_id: string;
              session_id: string;
              role: "assistant";
              type: "text";
              content: string;
              content_rich: Message["content_rich"] | null;
              card: Message["card"] | null;
              attachments: Message["attachments"] | null;
              status: Message["status"];
              feedback_status: Message["feedback_status"] | null;
              created_at: string;
            };
            cards: Array<{
              message_id: string;
              role: "assistant";
              type: "card";
              card: NonNullable<Message["card"]>;
              status: Message["status"];
            }>;
          };

          const final = payload.final;
          if (final?.message_id === assistantMessageId) {
            const hasContent =
              final.content ||
              final.content_rich ||
              (final.attachments && final.attachments.length > 0) ||
              final.card;

            if (!hasContent) {
              if (hasAddedAssistantMsg) {
                // 如果已经有消息了（比如流式出了一些），但 final 却是空的（理论上不应发生），这里还是更新一下状态
                updateMessage(currentSessionId, assistantMessageId, (msg) => {
                  msg.status = final.status ?? "sent";
                  msg.feedback_status = (final.feedback_status ??
                    "none") as Message["feedback_status"];
                });
              } else {
                // 如果没有任何内容，则不入库，并提示
                Toast.show("未生成有效内容");
              }
            } else if (!hasAddedAssistantMsg) {
              addMessage(currentSessionId, {
                message_id: assistantMessageId,
                session_id: currentSessionId,
                role: "assistant",
                type: "text",
                content: final.content || "",
                content_rich: final.content_rich ?? null,
                attachments: final.attachments ?? undefined,
                card: final.card ?? undefined,
                status: final.status ?? "sent",
                feedback_status: (final.feedback_status ??
                  "none") as Message["feedback_status"],
                created_at: final.created_at || new Date().toISOString(),
              });
              hasAddedAssistantMsg = true;
            } else {
              updateMessage(currentSessionId, assistantMessageId, (msg) => {
                msg.session_id = currentSessionId;
                msg.role = "assistant";
                msg.type = "text";
                msg.content = final.content || "";
                msg.content_rich = final.content_rich ?? null;
                msg.attachments = final.attachments ?? undefined;
                msg.card = final.card ?? undefined;
                msg.status = final.status ?? "sent";
                msg.feedback_status = (final.feedback_status ??
                  "none") as Message["feedback_status"];
                msg.created_at = final.created_at || msg.created_at;
              });
            }
          }

          const cardMessages: Message[] = (payload.cards || []).map((c) => ({
            message_id: c.message_id,
            session_id: currentSessionId,
            role: "assistant",
            type: "card",
            content: "",
            created_at: new Date().toISOString(),
            status: c.status ?? "sent",
            card: c.card,
            feedback_status: "none",
          }));

          cardMessages.forEach((m) => addMessage(currentSessionId, m));
        } finally {
          closeStream();
        }
      });

      es.addEventListener("error", (evt) => {
        const e = evt as MessageEvent<string>;
        if (e?.data) {
          try {
            const payload = JSON.parse(e.data) as {
              message_id?: string;
              message?: string;
            };
            if (
              !payload.message_id ||
              payload.message_id === assistantMessageId
            ) {
              if (payload.message) {
                Toast.show(payload.message);
              }
            }
          } catch {
            Toast.show("流式连接异常");
          }
        } else {
          Toast.show("流式连接失败");
        }

        if (hasAddedAssistantMsg) {
          updateMessage(currentSessionId, assistantMessageId, (msg) => {
            msg.status = "failed";
          });
        }
        closeStream();
      });
    } catch {
      updateMessage(currentSessionId, clientMessageId, (msg) => {
        msg.status = "failed";
      });
      setGenerating(false);
    }
  };

  const handleHistoryClick = () => {
    setHistoryVisible(true);
  };

  const handleNewSession = () => {
    initSession();
  };

  return (
    <div className="flex flex-col h-full relative">
      <TopNavBar
        onHistory={handleHistoryClick}
        onNewSession={handleNewSession}
      />

      {config?.disclaimer?.top_bar && (
        <DisclaimerTopBar text={config.disclaimer.top_bar} />
      )}

      {/* Chat Scroll Area */}
      {isHistoryLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          加载中...
        </div>
      ) : (
        <ChatMessageList
          messages={messages}
          onSend={handleSend}
          isGenerating={isGenerating}
        />
      )}

      {/* Bottom Fixed Area */}
      <div className="shrink-0 bg-bg-page pb-safe z-10">
        <BottomToolsBar
          tools={config?.tools || []}
          onToolClick={(key) => {
            if (key === "history") {
              setHistoryVisible(true);
            } else {
              Toast.show("功能建设中");
            }
          }}
        />
        <Composer
          limits={config?.limits}
          disabled={!activeSessionId || isCreatingSession}
          onSend={handleSend}
          isGenerating={isGenerating}
        />
      </div>

      {/* History Drawer */}
      <HistoryDrawer
        key={historyVisible ? "open" : "closed"}
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </div>
  );
}
