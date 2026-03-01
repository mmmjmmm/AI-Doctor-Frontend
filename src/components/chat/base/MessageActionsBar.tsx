import Icon from "@/components/Icon";
import clsx from "clsx";

interface MessageActionsBarProps {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onShare?: () => void;
  liked?: boolean;
  disliked?: boolean;
}

export default function MessageActionsBar({
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  onShare,
  liked,
  disliked,
}: MessageActionsBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <button
          onClick={onCopy}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="icon_fuzhihuifu"
        >
          <Icon name="copy" size={16} />
        </button>
        <button
          onClick={onRegenerate}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="重新生成"
        >
          <Icon name="icon_zhongxinshengcheng" size={16} />
        </button>
        <button
          onClick={onLike}
          className={clsx(
            "transition-colors",
            liked ? "text-primary" : "text-gray-400 hover:text-gray-600",
          )}
          aria-label="点赞"
        >
          <Icon name="icon_xihuan" size={16} />
        </button>
        <button
          onClick={onDislike}
          className={clsx(
            "transition-colors",
            disliked ? "text-primary" : "text-gray-400 hover:text-gray-600",
          )}
          aria-label="点踩"
        >
          <Icon name="icon_buxihuan" size={16} />
        </button>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onShare}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="分享"
        >
          <Icon name="icon_fenxiangduihua" size={16} />
        </button>
      </div>
    </div>
  );
}
