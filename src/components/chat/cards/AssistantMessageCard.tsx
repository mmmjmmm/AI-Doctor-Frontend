import { type Message } from "@/types/chat";
import BlockRenderer from "../base/BlockRenderer";
import AssistantAvatar from "../base/AssistantAvatar";
import CardFooter from "../base/CardFooter";
import MarkdownRenderer from "../base/MarkdownRenderer";

interface AssistantMessageCardProps {
  message: Message;
}

export default function AssistantMessageCard({
  message,
}: AssistantMessageCardProps) {
  const isRichContent =
    message.content_rich && message.content_rich.blocks.length > 0;

  return (
    <div className="flex flex-col mb-6">
      <AssistantAvatar />
      <div className="flex justify-start w-full">
        <div className="flex flex-col gap-1 max-w-[85%]">
          <div className="bg-white py-2 px-3 rounded-card  shadow-card">
            {isRichContent ? (
              <BlockRenderer blocks={message.content_rich?.blocks} />
            ) : (
              <MarkdownRenderer content={message.content} />
            )}

            <CardFooter
              disclaimer={message.disclaimer_bottom}
              feedbackStatus={message.feedback_status}
              onCopy={() => console.log("copy", message.message_id)}
              onRegenerate={() => console.log("regenerate", message.message_id)}
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
