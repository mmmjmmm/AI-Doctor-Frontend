import { type DownloadCard, type Message } from "@/types/chat";
import AssistantAvatar from "../base/AssistantAvatar";

interface DownloadAppCardProps {
  message: Message;
  withAvatar?: boolean;
}

export default function DownloadAppCard({
  message,
  withAvatar = true,
}: DownloadAppCardProps) {
  const card = message.card as DownloadCard;

  const handleDownload = () => {
    console.log("Download app");
  };

  return (
    <div className={withAvatar ? "flex flex-col mb-6" : "flex flex-col"}>
      {withAvatar && <AssistantAvatar />}
      <div className="flex justify-start w-full">
        <div className="bg-white p-4 rounded-card shadow-card w-[320px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
              <img
                src={card.icon_url}
                alt="App Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-gray-900 truncate">
                {card.title}
              </h3>
              {card.sub_title && (
                <p className="text-xs text-gray-500 mt-0.5">{card.sub_title}</p>
              )}
            </div>
          </div>

          {card.content && (
            <p className="text-sm text-gray-600 mb-4">{card.content}</p>
          )}

          {card.image_url && (
            <div className="mb-4 rounded-lg overflow-hidden bg-gray-50 aspect-[2/1]">
              <img
                src={card.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <button
            onClick={handleDownload}
            className="w-full py-2.5 bg-primary text-white rounded-full text-sm font-medium shadow-sm hover:bg-primary-pressed transition-colors"
          >
            {card.cta.text}
          </button>
        </div>
      </div>
    </div>
  );
}
