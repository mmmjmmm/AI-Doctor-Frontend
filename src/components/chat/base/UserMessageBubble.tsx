import clsx from "clsx";
import { type Message } from "@/types/chat";

export default function UserMessageBubble({ message }: { message: Message }) {
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
