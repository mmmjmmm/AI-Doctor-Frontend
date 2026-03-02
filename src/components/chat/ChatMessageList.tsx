import { useRef, useEffect } from "react";
import { type Message } from "@/types/chat";
import UserMessageBubble from "./base/UserMessageBubble";
import AssistantMessageCard from "./cards/AssistantMessageCard";
import IntakeFormCard from "./cards/IntakeFormCard";
import DownloadAppCard from "./cards/DownloadAppCard";
import ConsultSummaryCard from "./cards/ConsultSummaryCard";
import AssistantAvatar from "./base/AssistantAvatar";

interface ChatMessageListProps {
  messages: Message[];
  onSend?: (text: string) => void;
  isGenerating?: boolean;
}

export default function ChatMessageList({
  messages,
  onSend,
  isGenerating,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsg = messages[messages.length - 1];
  const scrollKey = lastMsg ? `${lastMsg.message_id}:${lastMsg.content}` : "";

  // 简单的自动滚动：当消息列表更新时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, scrollKey, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {(() => {
        const nodes: Array<React.ReactNode> = [];
        let i = 0;

        const renderAssistantItem = (
          msg: Message,
          key: string,
          withAvatar: boolean,
        ) => {
          if (msg.type === "text") {
            return (
              <AssistantMessageCard
                key={key}
                message={msg}
                withAvatar={withAvatar}
              />
            );
          }

          if (msg.type === "card" && msg.card) {
            switch (msg.card.card_type) {
              case "intake_form":
                return (
                  <IntakeFormCard
                    key={key}
                    message={msg}
                    withAvatar={withAvatar}
                    onSend={onSend}
                  />
                );
              case "download_app":
                return (
                  <DownloadAppCard
                    key={key}
                    message={msg}
                    withAvatar={withAvatar}
                  />
                );
              case "consult_summary":
                return (
                  <ConsultSummaryCard
                    key={key}
                    message={msg}
                    withAvatar={withAvatar}
                  />
                );
              default:
                return (
                  <AssistantMessageCard
                    key={key}
                    withAvatar={withAvatar}
                    message={{
                      ...msg,
                      type: "text",
                      content: "[不支持的卡片类型]",
                    }}
                  />
                );
            }
          }

          return null;
        };

        while (i < messages.length) {
          const msg = messages[i];

          if (msg.role === "user") {
            nodes.push(
              <UserMessageBubble key={msg.message_id} message={msg} />,
            );
            i += 1;
            continue;
          }

          if (msg.role === "assistant") {
            const group: Message[] = [];
            let j = i;
            while (j < messages.length && messages[j].role === "assistant") {
              group.push(messages[j]);
              j += 1;
            }

            const groupKey = `assistant_group_${group[0]?.message_id ?? i}`;
            nodes.push(
              <div key={groupKey} className="flex flex-col">
                <AssistantAvatar />
                <div className="flex flex-col gap-6">
                  {group.map((m) =>
                    renderAssistantItem(
                      m,
                      `${groupKey}_${m.message_id}`,
                      false,
                    ),
                  )}
                </div>
              </div>,
            );

            i = j;
            continue;
          }

          i += 1;
        }

        return nodes;
      })()}

      {/* Loading Bubble */}
      {isGenerating && (!lastMsg || lastMsg.role === "user") && (
        <div className="flex flex-col animate-fade-in">
          <AssistantAvatar />
          <div className="bg-white rounded-[16px] px-4 py-3 text-[#4A4F57] text-[15px] leading-relaxed shadow-sm w-fit mt-2 flex items-center gap-1">
            <span>正在生成回复...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
