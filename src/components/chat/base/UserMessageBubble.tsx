import clsx from "clsx";
import { type Message } from "@/types/chat";

export default function UserMessageBubble({ message }: { message: Message }) {
  const attachment = message.attachments?.find((item) => item.type === "image");

  if (attachment) {
    const progress = attachment?.meta?.upload_progress;

    return (
      <div className="flex justify-end w-full mb-6">
        <div className="w-full flex flex-col items-end gap-2">
          <div className="relative overflow-hidden rounded-[18px] rounded-tr-none shadow-sm bg-primary/10 border border-primary/10">
            {attachment?.url ? (
              <img
                src={attachment.url}
                alt="upload"
                className="block w-[180px] h-[180px] object-cover"
              />
            ) : (
              <div className="w-[180px] h-[180px] bg-gray-200" />
            )}
            {message.status !== "sent" && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <div className="px-3 py-2 rounded-full bg-black/55 text-white text-sm">
                  {message.status === "failed"
                    ? message.error_message || "上传失败"
                    : `上传中${typeof progress === "number" ? ` ${progress}%` : ""}`}
                </div>
              </div>
            )}
          </div>

          {message.content ? (
            <div
              className={clsx(
                "bg-primary text-white p-3 px-4",
                "rounded-card rounded-tr-none shadow-sm",
                "max-w-[80%] text-[15px] leading-6 break-words",
              )}
            >
              {message.content}
            </div>
          ) : null}

          {message.status === "failed" && (
            <div className="text-xs text-red-500">
              {message.error_message || "上传失败，请重试"}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end w-full mb-6">
      <div
        className={clsx(
          "bg-primary text-white p-3 px-4",
          "rounded-card rounded-tr-none shadow-sm",
          "max-w-[80%] text-[15px] leading-6 break-words",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
