import { useState } from "react";
import clsx from "clsx";
import {
  type IntakeFormCard as IntakeFormCardType,
  type Message,
} from "@/types/chat";
import AssistantAvatar from "../base/AssistantAvatar";

interface IntakeFormCardProps {
  message: Message;
}

export default function IntakeFormCard({ message }: IntakeFormCardProps) {
  const card = message.card as IntakeFormCardType;
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");

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
    console.log("Submit:", {
      selectedKeys: Array.from(selectedKeys),
      freeText,
    });
  };

  const isSubmitDisabled = selectedKeys.size === 0 && !freeText.trim();

  return (
    <div className="flex flex-col mb-6">
      <AssistantAvatar />
      <div className="flex justify-start w-full">
        <div className="bg-white p-4 rounded-card shadow-card max-w-[85%]">
          <h3 className="text-[15px] font-medium text-gray-900 mb-3 leading-6">
            {card.title}
          </h3>

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
        </div>
      </div>
    </div>
  );
}
