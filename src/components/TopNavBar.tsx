import Icon from "./Icon";

interface TopNavBarProps {
  title?: string;
  onBack?: () => void;
  onHome?: () => void;
  onNewSession?: () => void;
  onOpenTools?: () => void;
  onHistory?: () => void;
}

export default function TopNavBar({
  title = "小荷 AI 医生",
  onBack,
  onHome,
  onNewSession,
  onHistory,
}: TopNavBarProps) {
  return (
    <div className="h-11 bg-white border-b border-gray-200 px-3 flex items-center justify-between shrink-0 z-50 relative">
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="text-gray-900 p-1">
          <Icon name="fenxiang" size={24} />
        </button>
        <button onClick={onHome} className="text-gray-900 p-1">
          <Icon name="home" size={22} />
        </button>
      </div>

      <div className="text-[16px] font-semibold text-gray-900 truncate px-2 text-center flex-1">
        {title}
      </div>

      <div className="flex items-center justify-end gap-1 shrink-0">
        <button onClick={onNewSession} className="text-gray-900 p-1.5">
          <Icon name="chat_add" size={22} />
        </button>
        <button onClick={onHistory} className="text-gray-900 p-1.5">
          <Icon name="cc-history" size={22} />
        </button>
      </div>
    </div>
  );
}
