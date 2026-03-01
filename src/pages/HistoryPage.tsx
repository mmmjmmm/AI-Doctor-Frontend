import TopNavBar from '../components/TopNavBar';
import Icon from '../components/Icon';

export default function HistoryPage() {
  return (
    <div className="flex flex-col h-full bg-bg-page">
      <TopNavBar title="历史咨询" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center h-60 space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
            <Icon name="cc-history" size={32} />
          </div>
          <p className="text-gray-400 text-sm">暂无历史咨询记录</p>
        </div>
      </div>
    </div>
  );
}
