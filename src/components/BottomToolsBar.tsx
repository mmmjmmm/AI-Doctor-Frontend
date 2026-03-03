import Icon from "./Icon";
import type { AppTool } from "@/api/app";

interface BottomToolsBarProps {
  tools?: AppTool[];
  onToolClick?: (tool: AppTool) => void;
}

export default function BottomToolsBar({
  tools,
  onToolClick,
}: BottomToolsBarProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-3 px-4 min-w-min">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => onToolClick?.(tool)}
            className="flex items-center gap-2 px-2 py-2 bg-transparent border border-gray-200 rounded-[12px] shrink-0 active:bg-gray-50 transition-colors"
          >
            <Icon
              name={tool.icon || "comment"}
              size={20}
              className="text-gray-900"
            />
            <span className="text-[15px] font-semibold text-gray-900 whitespace-nowrap">
              {tool.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
