import { useState } from "react";
import { type ConsultSummaryCardData, type Message } from "@/types/chat";
import Icon from "@/components/Icon";
import AssistantAvatar from "../base/AssistantAvatar";
import CardFooter from "../base/CardFooter";

interface ConsultSummaryCardProps {
  message: Message;
}

export default function ConsultSummaryCard({
  message,
}: ConsultSummaryCardProps) {
  const card = message.card as ConsultSummaryCardData;

  // State for patient info collapse (default expanded)
  const [patientInfoCollapsed, setPatientInfoCollapsed] = useState(false);

  // State for advice list items collapse (default expanded)
  const [adviceCollapsedState, setAdviceCollapsedState] = useState<boolean[]>(
    new Array(card.advice_list.length).fill(false),
  );

  const toggleAdvice = (index: number) => {
    setAdviceCollapsedState((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div className="flex flex-col mb-6">
      <AssistantAvatar />
      <div className="flex justify-start w-full">
        <div className="bg-white rounded-[16px] shadow-sm w-[90%] overflow-hidden border border-gray-100">
          <div className="p-4 space-y-4">
            {/* 1. Gray Hint */}
            {card.hint && <p className="text-xs text-gray-400">{card.hint}</p>}

            {/* 2. Title */}
            <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>

            {/* 3. Summary */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {card.summary}
            </p>

            {/* 4. Patient Info Card (Collapsible) */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
              <button
                className="w-full flex items-center justify-between p-3"
                onClick={() => setPatientInfoCollapsed(!patientInfoCollapsed)}
              >
                <span className="text-sm font-bold text-gray-800">
                  {card.patient_info.title}
                </span>
                <Icon
                  name={patientInfoCollapsed ? "arrow-down" : "arrow-up"}
                  size={14}
                  className="text-gray-400"
                />
              </button>

              {!patientInfoCollapsed && (
                <div className="p-3 pt-0 grid grid-cols-1 gap-2">
                  <div className="h-px bg-gray-200 mb-2 opacity-50" />
                  {card.patient_info.items.map((item, idx) => (
                    <div key={idx} className="flex text-xs">
                      <span className="text-gray-500 w-16 shrink-0">
                        {item.label}
                      </span>
                      <span className="text-gray-900 flex-1">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Advice List (Collapsible Items) */}
            <div className="space-y-3">
              {card.advice_list.map((advice, idx) => {
                const isCollapsed = adviceCollapsedState[idx];
                return (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-xl overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between p-3 bg-white"
                      onClick={() => toggleAdvice(idx)}
                    >
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-1 h-3 bg-primary rounded-full" />
                        {advice.title}
                      </span>
                      <Icon
                        name={isCollapsed ? "arrow-down" : "arrow-up"}
                        size={14}
                        className="text-gray-400"
                      />
                    </button>
                    {!isCollapsed && (
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {advice.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Footer */}
          <div className="px-4 pb-4">
            <CardFooter
              disclaimer={card.footer?.disclaimer}
              feedbackStatus={message.feedback_status}
              onLike={() => console.log("like", message.message_id)}
              onDislike={() => console.log("dislike", message.message_id)}
              onShare={() => console.log("share", message.message_id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
