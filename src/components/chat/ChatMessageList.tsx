import React, { useRef, useEffect } from 'react';
import { type Message } from '@/types/chat';
import UserMessageBubble from './base/UserMessageBubble';
import AssistantMessageCard from './cards/AssistantMessageCard';
import IntakeFormCard from './cards/IntakeFormCard';
import DownloadAppCard from './cards/DownloadAppCard';
import ConsultSummaryCard from './cards/ConsultSummaryCard';

interface ChatMessageListProps {
  messages: Message[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 简单的自动滚动：当消息列表更新时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((msg) => {
        // 1. 用户消息
        if (msg.role === 'user') {
          return <UserMessageBubble key={msg.message_id} message={msg} />;
        }

        // 2. AI 消息
        if (msg.role === 'assistant') {
          if (msg.type === 'text') {
            return <AssistantMessageCard key={msg.message_id} message={msg} />;
          }

          if (msg.type === 'card' && msg.card) {
            switch (msg.card.card_type) {
              case 'intake_form':
                return <IntakeFormCard key={msg.message_id} message={msg} />;
              case 'download_app':
                return <DownloadAppCard key={msg.message_id} message={msg} />;
              case 'consult_summary':
                return <ConsultSummaryCard key={msg.message_id} message={msg} />;
              default:
                // 未知卡片类型降级为文本
                return (
                  <AssistantMessageCard
                    key={msg.message_id}
                    message={{ ...msg, type: 'text', content: '[不支持的卡片类型]' }}
                  />
                );
            }
          }
        }

        return null;
      })}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
