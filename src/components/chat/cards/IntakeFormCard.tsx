import { useState } from "react";
import clsx from "clsx";
import {
  type IntakeFormCard as IntakeFormCardType,
  type Message,
} from "@/types/chat";
import AssistantAvatar from "../base/AssistantAvatar";

interface IntakeFormCardProps {
  message: Message;
  withAvatar?: boolean;
  onSend?: (text: string) => void;
}

export default function IntakeFormCard({
  message,
  withAvatar = true,
  onSend,
}: IntakeFormCardProps) {
  const card = message.card as IntakeFormCardType;
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (key: string) => {
    if (card.allow_multi) {
      const newSet = new Set(selectedKeys);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      setSelectedKeys(newSet);
    } else {
      // Toggle logic for single select
      if (selectedKeys.has(key)) {
        setSelectedKeys(new Set());
      } else {
        setSelectedKeys(new Set([key]));
      }
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    if (card.submit.action !== "send_message") return;
    if (!onSend) return;

    const selected = Array.from(selectedKeys);
    const selectedLabels = card.options
      .filter((o) => selected.includes(o.key))
      .map((o) => o.label);

    const parts: string[] = [];
    parts.push(card.title);
    if (selectedLabels.length > 0) {
      parts.push(`选择：${selectedLabels.join("、")}`);
    }

    const trimmed = freeText.trim();
    if (trimmed) {
      parts.push(`补充：${trimmed}`);
    }

    const content = parts.join("\n");
    setSubmitted(true);
    onSend(content);

    setSelectedKeys(new Set());
    setFreeText("");
  };

  const isSubmitDisabled = selectedKeys.size === 0 && !freeText.trim();

  return (
    <div className={withAvatar ? "flex flex-col mb-6" : "flex flex-col"}>
      {withAvatar && <AssistantAvatar />}
      <div className="flex justify-start w-full">
        <div className="bg-white p-4 rounded-card shadow-card w-[320px]">
          <h3
            className={clsx(
              "text-[15px] font-medium text-gray-900 leading-6",
              submitted ? "mb-0" : "mb-3",
            )}
          >
            {card.title}
          </h3>

          {!submitted && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {card.options.map((option) => {
                  const isSelected = selectedKeys.has(option.key);
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleSelect(option.key)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-sm transition-colors border",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {card.free_text.enabled && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder={card.free_text.placeholder}
                    maxLength={card.free_text.max_len}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className={clsx(
                  "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                  isSubmitDisabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-pressed shadow-sm",
                )}
              >
                {card.submit.button_text}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
