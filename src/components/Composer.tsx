import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import clsx from "clsx";

interface ComposerProps {
  limits?: {
    text_max_len: number;
    send_rate_limit_ms: number;
    image_max_mb: number;
    upload_timeout_s: number;
  };
  disabled?: boolean;
  onSend?: (text: string) => void;
  onStop?: () => void | Promise<unknown>;
  isGenerating?: boolean;
}

export default function Composer({
  limits,
  disabled,
  onSend,
  onStop,
  isGenerating,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedValue = value.trim();
  const canSend = !disabled && !isGenerating && !!trimmedValue;

  const handleSend = () => {
    if (disabled) return;
    if (isGenerating) {
      void onStop?.();
      return;
    }
    if (!trimmedValue) return;
    onSend?.(trimmedValue);
    setValue("");
    setIsFocused(false);
  };

  const renderPrimaryActionButton = () => (
    <button
      className={clsx(
        "w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white shadow-md transition-all",
        canSend || isGenerating
          ? "active:scale-95"
          : "opacity-45 cursor-not-allowed",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleSend}
      aria-label={isGenerating ? "停止生成" : "发送消息"}
      disabled={disabled || (!isGenerating && !trimmedValue)}
    >
      {isGenerating ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon name="arrowup" size={16} className="text-white" />
      )}
    </button>
  );

  // 聚焦时自动调整高度
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
      // 简单的自适应高度逻辑
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isFocused]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // 自适应高度
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <div className={clsx(
      "px-4 py-2 bg-bg-page pb-safe transition-all duration-300 ease-in-out",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <div
        className={clsx(
          "bg-white rounded-[20px] shadow-sm border border-gray-100 transition-all duration-300",
          isFocused
            ? "p-4 flex flex-col gap-3"
            : "px-3 py-3 flex items-center gap-3",
        )}
      >
        {isFocused ? (
          /* 展开态：多行文本域 + 工具栏 */
          <>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              onBlur={() => {
                // 稍微延迟 blur，以便处理点击按钮事件
                setTimeout(() => setIsFocused(false), 150);
              }}
              placeholder="发送消息"
              rows={1}
              maxLength={limits?.text_max_len}
              className="w-full bg-transparent border-none outline-none text-[16px] placeholder-gray-400 caret-primary resize-none min-h-[24px] max-h-[120px]"
            />
            <div className="flex items-center justify-between pt-1">
              {/* 左侧：结合历史对话 */}
              <button
                className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 active:bg-gray-100"
                onMouseDown={(e) => e.preventDefault()} // 防止失焦
              >
                结合历史对话
              </button>

              {/* 右侧：图标组 */}
              <div className="flex items-center gap-4">
                <button
                  className="text-gray-900"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Icon
                    name="VOICE_MESSAGE"
                    size={24}
                    style={{ fontWeight: "bold" }}
                  />
                </button>
                <button
                  className="text-gray-900"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Icon name="pic" size={24} />
                </button>
                {renderPrimaryActionButton()}
              </div>
            </div>
          </>
        ) : (
          /* 收起态：单行输入框 */
          <>
            <button className="text-gray-900 shrink-0">
              <Icon
                name="VOICE_MESSAGE"
                size={24}
                style={{ fontWeight: "bold" }}
              />
            </button>

            <input
              type="text"
              value={value}
              onFocus={() => setIsFocused(true)}
              placeholder="发送消息"
              className="flex-1 bg-transparent border-none outline-none text-[16px] placeholder-gray-400 caret-primary h-6 truncate"
              readOnly={false} // 允许聚焦
            />

            <button className="text-gray-900 shrink-0">
              <Icon name="pic" size={24} />
            </button>

            {renderPrimaryActionButton()}
          </>
        )}
      </div>
    </div>
  );
}
