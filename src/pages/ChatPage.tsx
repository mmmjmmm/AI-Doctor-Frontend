import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Toast } from "antd-mobile";
import TopNavBar from "@/components/TopNavBar";
import DisclaimerTopBar from "@/components/DisclaimerTopBar";
import BottomToolsBar from "@/components/BottomToolsBar";
import Composer from "@/components/Composer";
import HistoryDrawer from "@/components/HistoryDrawer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAppConfig, type AppTool } from "@/api/app";
import { createSession } from "@/api/session";
import { getHistoryDetail } from "@/api/history";
import { sendMessage, stopMessage } from "@/api/message";
import { uploadImage } from "@/api/upload";
import { useChatStore } from "@/store/useChatStore";
import { useAppStore } from "@/store/useAppStore";
import { useTaskStore } from "@/store/useTaskStore";
import type { Message, TaskType } from "@/types/chat";

export default function ChatPage() {
  const [historyVisible, setHistoryVisible] = useState(false);
  const [pendingImageTool, setPendingImageTool] = useState<AppTool | null>(null);
  const justCreatedSessionIdRef = useRef<string | null>(null);
  const streamMapRef = useRef<Record<string, EventSource>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    removeMessage,
    generatingBySession,
    setSessionGenerating,
    streamingMessageIdBySession,
    setStreamingMessageId,
    interruptAssistantMessage,
  } = useChatStore();
  const { setRuntimeStatus } = useTaskStore();

  const messages = activeSessionId
    ? messagesBySession[activeSessionId] || []
    : [];
  const isGenerating = useMemo(
    () => (activeSessionId ? !!generatingBySession[activeSessionId] : false),
    [activeSessionId, generatingBySession],
  );
  const streamingMessageId = activeSessionId
    ? streamingMessageIdBySession[activeSessionId] || null
    : null;

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

  const initSessionRequestedRef = useRef(false);

  // 4. 初始化：如果无 URL sessionId 且无 activeSessionId，自动创建
  useEffect(() => {
    if (sessionId || activeSessionId) {
      initSessionRequestedRef.current = false;
      return;
    }

    if (isCreatingSession || initSessionRequestedRef.current) {
      return;
    }

    initSessionRequestedRef.current = true;
    initSession();
  }, [sessionId, activeSessionId, isCreatingSession, initSession]);

  useEffect(() => {
    const streams = streamMapRef.current;
    return () => {
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

    if (activeSessionId) {
      setSessionGenerating(activeSessionId, false);
      setStreamingMessageId(activeSessionId, null);
      setRuntimeStatus(activeSessionId, "idle");
    }
  }, [activeSessionId, setRuntimeStatus, setSessionGenerating, setStreamingMessageId]);

  const { mutateAsync: sendMessageAsync } = useMutation({
    mutationFn: sendMessage,
  });

  const { mutateAsync: stopMessageAsync } = useMutation({
    mutationFn: stopMessage,
  });

  const stopCurrentTask = async () => {
    if (!activeSessionId || !streamingMessageId) return false;

    try {
      await stopMessageAsync({
        session_id: activeSessionId,
        assistant_message_id: streamingMessageId,
      });
    } catch {
      // stop 接口失败时允许前端先本地中断，避免阻塞用户继续发起新任务。
    }

    const stream = streamMapRef.current[streamingMessageId];
    if (stream) {
      stream.close();
      delete streamMapRef.current[streamingMessageId];
    }

    interruptAssistantMessage(activeSessionId, streamingMessageId);
    setSessionGenerating(activeSessionId, false);
    setStreamingMessageId(activeSessionId, null);
    setRuntimeStatus(activeSessionId, "idle");
    return true;
  };

  const normalizeToolKey = (key: AppTool["key"]) => {
    if (key === "report") return "report_interpret";
    if (key === "download") return "open_app";
    if (key === "photo") return "body_part";
    if (key === "doctor") return "doctor_reco";
    if (key === "medicine") return "drug";
    return key;
  };

  const getTaskTypeByToolKey = (key: ReturnType<typeof normalizeToolKey>) => {
    if (key === "report_interpret") return "report_interpret";
    if (key === "body_part") return "body_part";
    if (key === "ingredient") return "ingredient";
    if (key === "drug") return "drug";
    return null;
  };

  const getDefaultTaskPrompt = (taskType: TaskType) => {
    switch (taskType) {
      case "report_interpret":
        return "请帮我解读这份报告";
      case "body_part":
        return "请帮我看看这个患处";
      case "ingredient":
        return "请帮我分析这个成分";
      case "drug":
        return "请帮我看看这个药品";
      default:
        return "";
    }
  };

  const handleSend = async (
    text: string,
    options?: {
      taskType?: TaskType;
      skipLocalUserMessage?: boolean;
      attachment_ids?: string[];
      replaceMessageIds?: string[];
      task_context?: {
        task_type: TaskType;
        entry: "quick_tool" | "composer" | "history_retry";
        images?: Array<{ file_id: string; url?: string }>;
      };
    },
  ) => {
    if (!activeSessionId) return;
    const currentSessionId = activeSessionId;

    const now = new Date().toISOString();
    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    if (!options?.skipLocalUserMessage) {
      addMessage(currentSessionId, {
        message_id: clientMessageId,
        session_id: currentSessionId,
        role: "user",
        type: "text",
        content: text,
        created_at: now,
        status: "sending",
        task_type: options?.taskType ?? "chat",
      });
    }

    setRuntimeStatus(currentSessionId, "sending_user_message");
    setSessionGenerating(currentSessionId, true);

    try {
      const resp = await sendMessageAsync({
        session_id: currentSessionId,
        client_message_id: clientMessageId,
        content: text,
        task_context: options?.task_context,
        attachment_ids: options?.attachment_ids,
      });

      if (!options?.skipLocalUserMessage) {
        updateMessage(currentSessionId, clientMessageId, (msg) => {
          msg.status = "sent";
        });
      } else if (resp.user_message) {
        (options?.replaceMessageIds || []).forEach((messageId) => {
          removeMessage(currentSessionId, messageId);
        });

        addMessage(currentSessionId, {
          ...resp.user_message,
          feedback_status: resp.user_message.feedback_status ?? "none",
          attachments: resp.user_message.attachments ?? [],
        });
      }

      const assistantMessageId = resp.assistant_message_id;
      let hasAddedAssistantMsg = false;

      const existed = streamMapRef.current[assistantMessageId];
      if (existed) {
        existed.close();
        delete streamMapRef.current[assistantMessageId];
      }

      const es = new EventSource(resp.stream.stream_url);
      streamMapRef.current[assistantMessageId] = es;
      setStreamingMessageId(currentSessionId, assistantMessageId);
      setRuntimeStatus(currentSessionId, "ai_streaming");

      const closeStream = () => {
        const stream = streamMapRef.current[assistantMessageId];
        if (stream) {
          stream.close();
          delete streamMapRef.current[assistantMessageId];
        }
        setSessionGenerating(currentSessionId, false);
        setStreamingMessageId(currentSessionId, null);
        setRuntimeStatus(currentSessionId, "idle");
      };

      es.addEventListener("status", (evt) => {
        const e = evt as MessageEvent<string>;
        if (!e.data) return;

        try {
          const payload = JSON.parse(e.data) as {
            text?: string;
            step?: string;
          };

          if (!payload.text) return;

          if (payload.step === "multimodal_generating") {
            setRuntimeStatus(currentSessionId, "vision_analyzing");
          }

          addMessage(currentSessionId, {
            message_id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `status_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            session_id: currentSessionId,
            role: "assistant",
            type: "status",
            content: payload.text,
            created_at: new Date().toISOString(),
            status: "sent",
            client_only: true,
          });
        } catch {
          return;
        }
      });

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
              thinking_status: "thinking",
            });
            hasAddedAssistantMsg = true;
          } else {
            updateMessage(currentSessionId, assistantMessageId, (msg) => {
              msg.content = (msg.content || "") + payload.text;
              if (!msg.thinking_status || msg.thinking_status === "none") {
                msg.thinking_status = "thinking";
              }
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
              task_type?: Message["task_type"];
              thinking_status?: Message["thinking_status"];
              fold_meta?: Message["fold_meta"];
              action_meta?: Message["action_meta"];
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
                task_type: final.task_type ?? "chat",
                thinking_status: final.thinking_status ?? "done",
                fold_meta: final.fold_meta ?? undefined,
                action_meta: final.action_meta ?? undefined,
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
                msg.task_type = final.task_type ?? msg.task_type ?? "chat";
                msg.thinking_status = final.thinking_status ?? "done";
                msg.fold_meta = final.fold_meta ?? msg.fold_meta;
                msg.action_meta = final.action_meta ?? msg.action_meta;
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
            task_type: final?.task_type ?? "chat",
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
        setRuntimeStatus(currentSessionId, "error");
        closeStream();
      });
    } catch {
      if (!options?.skipLocalUserMessage) {
        updateMessage(currentSessionId, clientMessageId, (msg) => {
          msg.status = "failed";
        });
      }
      setSessionGenerating(currentSessionId, false);
      setStreamingMessageId(currentSessionId, null);
      setRuntimeStatus(currentSessionId, "error");
    }
  };

  const handleHistoryClick = () => {
    setHistoryVisible(true);
  };

  const handleNewSession = () => {
    initSession();
  };

  const openImagePicker = (tool: AppTool) => {
    setPendingImageTool(tool);
    imageInputRef.current?.click();
  };

  const handleImageInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!activeSessionId || !pendingImageTool || files.length === 0) {
      setPendingImageTool(null);
      return;
    }

    const normalizedKey = normalizeToolKey(pendingImageTool.key);
    const taskType = getTaskTypeByToolKey(normalizedKey);

    if (!taskType) {
      Toast.show("当前入口暂不支持图片分析");
      setPendingImageTool(null);
      return;
    }

    const run = async () => {
      setRuntimeStatus(activeSessionId, "uploading_image");

      const uploadedImages: Array<{ file_id: string }> = [];
      const localImageMessageIds: string[] = [];

      for (const file of files) {
        const localMessageId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        localImageMessageIds.push(localMessageId);

        const previewUrl = URL.createObjectURL(file);

        addMessage(activeSessionId, {
          message_id: localMessageId,
          session_id: activeSessionId,
          role: "user",
          type: "image",
          content: "",
          attachments: [
            {
              attachment_id: localMessageId,
              type: "image",
              url: previewUrl,
              meta: {
                size: file.size,
                upload_progress: 0,
              },
            },
          ],
          created_at: new Date().toISOString(),
          status: "sending",
          task_type: taskType,
          client_only: true,
        });

        try {
          const uploaded = await uploadImage({
            file,
            biz: taskType,
          });

          uploadedImages.push({
            file_id: uploaded.file_id,
          });

          updateMessage(activeSessionId, localMessageId, (msg) => {
            msg.status = "sent";
            msg.attachments = [
              {
                attachment_id: uploaded.file_id,
                type: "image",
                url: uploaded.url,
                meta: {
                  width: uploaded.width,
                  height: uploaded.height,
                  size: uploaded.size,
                  upload_progress: 100,
                },
              },
            ];
          });
        } catch {
          updateMessage(activeSessionId, localMessageId, (msg) => {
            msg.status = "failed";
            msg.error_message = "上传失败";
          });
        }
      }

      if (uploadedImages.length === 0) {
        setRuntimeStatus(activeSessionId, "error");
        setPendingImageTool(null);
        return;
      }

      await handleSend(getDefaultTaskPrompt(taskType), {
        taskType,
        skipLocalUserMessage: true,
        attachment_ids: uploadedImages.map((item) => item.file_id),
        replaceMessageIds: localImageMessageIds,
        task_context: {
          task_type: taskType,
          entry: "quick_tool",
          images: uploadedImages,
        },
      });

      setPendingImageTool(null);
    };

    void run();
  };

  const handleToolClick = async (tool: AppTool) => {
    if (!activeSessionId) return;

    const normalizedKey = normalizeToolKey(tool.key);

    if (isGenerating) {
      await stopCurrentTask();
    }

    switch (tool.trigger_mode) {
      case "route":
        setHistoryVisible(true);
        return;
      case "deeplink":
        navigate("/open-app");
        return;
      case "send_message":
        await handleSend(tool.preset_text || "帮我找医生");
        return;
      case "pick_image":
        openImagePicker(tool);
        return;
      default:
        if (normalizedKey === "history") {
          setHistoryVisible(true);
          return;
        }
        if (normalizedKey === "open_app") {
          navigate("/open-app");
          return;
        }
        if (normalizedKey === "doctor_reco") {
          await handleSend(tool.preset_text || "帮我找医生");
          return;
        }
        if (
          normalizedKey === "report_interpret" ||
          normalizedKey === "body_part" ||
          normalizedKey === "ingredient" ||
          normalizedKey === "drug"
        ) {
          openImagePicker(tool);
          return;
        }
        Toast.show("功能建设中");
    }
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

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleImageInputChange}
      />

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
          onToolClick={handleToolClick}
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
