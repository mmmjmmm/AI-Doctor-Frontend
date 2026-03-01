import Icon from "./Icon";

interface Tool {
  key: string;
  title: string;
  icon: string;
}

const DEFAULT_TOOLS: Tool[] = [
  { key: "report", title: "报告解读", icon: "report" },
  { key: "download", title: "立即下载", icon: "download1" },
  { key: "photo", title: "拍患处", icon: "camera" },
  { key: "ingredient", title: "拍成分", icon: "ingredients" },
  { key: "doctor", title: "就医推荐", icon: "pre_comment" },
  { key: "medicine", title: "拍药品", icon: "medicine" },
  { key: "history", title: "咨询记录", icon: "cc-history" },
];

interface BottomToolsBarProps {
  onToolClick?: (key: string) => void;
}

export default function BottomToolsBar({ onToolClick }: BottomToolsBarProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-3 px-4 min-w-min">
        {DEFAULT_TOOLS.map((tool) => (
          <button
            key={tool.key}
            onClick={() => onToolClick?.(tool.key)}
            className="flex items-center gap-2 px-2 py-2 bg-transparent border border-gray-200 rounded-[12px] shrink-0 active:bg-gray-50 transition-colors"
          >
            <Icon name={tool.icon} size={20} className="text-gray-900" />
            <span className="text-[15px] font-semibold text-gray-900 whitespace-nowrap">
              {tool.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
