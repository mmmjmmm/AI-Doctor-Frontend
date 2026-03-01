import { useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import DisclaimerTopBar from "@/components/DisclaimerTopBar";
import BottomToolsBar from "@/components/BottomToolsBar";
import Composer from "@/components/Composer";
import HistoryDrawer from "@/components/HistoryDrawer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import { MOCK_MESSAGES } from "@/data/mockMessages";

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
      <ChatMessageList messages={MOCK_MESSAGES} />

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
