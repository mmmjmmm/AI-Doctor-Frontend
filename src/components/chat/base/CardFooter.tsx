import MessageActionsBar from "./MessageActionsBar";
import DisclaimerBottomHint from "./DisclaimerBottomHint";
import { type FeedbackStatus } from "@/types/chat";

interface CardFooterProps {
  disclaimer?: string;
  feedbackStatus?: FeedbackStatus;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onShare?: () => void;
}

export default function CardFooter({
  disclaimer,
  feedbackStatus,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  onShare,
}: CardFooterProps) {
  return (
    <div className="mt-3">
      {/* 1. 免责声明 (上方) */}
      <DisclaimerBottomHint text={disclaimer} />

      {/* 2. 灰色分割线 (中间) */}
      <div className="h-px bg-gray-100 my-2" />

      {/* 3. 操作栏 (下方) */}
      <MessageActionsBar
        onCopy={onCopy}
        onRegenerate={onRegenerate}
        onLike={onLike}
        onDislike={onDislike}
        onShare={onShare}
        liked={feedbackStatus === "liked"}
        disliked={feedbackStatus === "disliked"}
      />
    </div>
  );
}
