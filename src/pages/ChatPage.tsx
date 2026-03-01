import { useState } from "react";
import TopNavBar from "../components/TopNavBar";
import DisclaimerTopBar from "../components/DisclaimerTopBar";
import BottomToolsBar from "../components/BottomToolsBar";
import Composer from "../components/Composer";
import HistoryDrawer from "../components/HistoryDrawer";

export default function ChatPage() {
  const [historyVisible, setHistoryVisible] = useState(false);

  const handleHistoryClick = () => {
    setHistoryVisible(true);
  };

  return (
    <div className="flex flex-col h-full relative">
      <TopNavBar onHistory={handleHistoryClick} />
      <DisclaimerTopBar />

      {/* Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Mock Welcome Message */}
        <div className="flex justify-start w-full">
          <div className="flex flex-col gap-1 max-w-[85%]">
            <div className="bg-white p-4 rounded-card rounded-tl-none shadow-card text-[15px] leading-relaxed text-gray-900">
              <p>
                你好，我是小荷健康推出的 AI 健康咨询助手，可以为你提供全天 24
                小时的健康帮助，快来和我对话吧！
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">你可以这样问我：</p>
                <ul className="space-y-1.5">
                  <li className="text-primary text-sm">
                    · 小肚子胀胀的怎么回事
                  </li>
                  <li className="text-primary text-sm">· 便秘怎么快速排便</li>
                </ul>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 ml-1">
              AI生成仅供参考
            </span>
          </div>
        </div>

        {/* Mock User Message */}
        <div className="flex justify-end w-full">
          <div className="bg-primary text-white p-3 px-4 rounded-card rounded-tr-none shadow-sm max-w-[80%] text-[15px] leading-6">
            我最近总是失眠
          </div>
        </div>
      </div>

      {/* Bottom Fixed Area */}
      <div className="shrink-0 bg-bg-page pb-safe z-10">
        <BottomToolsBar
          onToolClick={(key) => {
            if (key === "history") {
              setHistoryVisible(true);
            }
          }}
        />
        <Composer />
      </div>

      {/* History Drawer */}
      <HistoryDrawer
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        onSelectSession={(id) => {
          console.log("Selected session:", id);
          // TODO: Load session
        }}
      />
    </div>
  );
}
