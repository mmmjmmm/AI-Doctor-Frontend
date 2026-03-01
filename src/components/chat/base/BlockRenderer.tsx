import { type ContentRichBlock } from "@/types/chat";

interface BlockRendererProps {
  blocks?: ContentRichBlock[];
  fallbackContent?: string;
}

export default function BlockRenderer({
  blocks,
  fallbackContent,
}: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-[15px] leading-7 text-gray-900 whitespace-pre-wrap">
        {fallbackContent}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const blockKey =
          block.type === "list"
            ? `${block.type}-${block.items.join("|")}-${index}`
            : `${block.type}-${block.text}-${index}`;
        if (block.type === "heading") {
          return (
            <h3
              key={blockKey}
              className="text-[16px] font-bold text-gray-900 mt-4 mb-2 first:mt-0"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p
              key={blockKey}
              className="text-[15px] leading-7 text-gray-900 whitespace-pre-wrap text-justify"
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={blockKey} className="space-y-2 pl-1">
              {block.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start text-[15px] leading-7 text-gray-900"
                >
                  <span className="mr-2 mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}
