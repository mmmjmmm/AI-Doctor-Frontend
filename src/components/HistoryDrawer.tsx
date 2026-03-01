import { useState, useEffect } from "react";
import { Popup, Dialog, Toast } from "antd-mobile";
import Icon from "./Icon";
import clsx from "clsx";

interface HistorySession {
  id: string;
  title: string;
  summary: string;
  date: string;
}

const MOCK_SESSIONS: HistorySession[] = [
  {
    id: "1",
    title: "失眠是什么原因",
    summary: "收到你说“经常失眠，每周好几天”这个信息了...",
    date: "2023-10-25",
  },
  {
    id: "2",
    title: "失眠是什么原因造成的",
    summary: "好的，看来您对目前的情况和改善方案已经很清...",
    date: "2023-10-24",
  },
  {
    id: "3",
    title: "美甲后指甲护理建议",
    summary: "**小荷 AI 医生划重点：** 从图片来看，您的指甲...",
    date: "2023-10-23",
  },
  { id: "4", title: "[图片]", summary: "", date: "2023-10-22" },
  {
    id: "5",
    title: "头痛原因及相关医生推荐 [图片*1]",
    summary: "",
    date: "2023-10-21",
  },
];

interface HistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSession?: (id: string) => void;
}

const CustomCheckbox = ({ checked }: { checked: boolean }) => (
  <div
    className={clsx(
      "w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0",
      checked
        ? "bg-primary border-none"
        : "border-[1.5px] border-gray-300 bg-transparent",
    )}
  >
    {checked && <Icon name="check" size={12} className="text-white" />}
  </div>
);

export default function HistoryDrawer({
  visible,
  onClose,
  onSelectSession,
}: HistoryDrawerProps) {
  const [sessions, setSessions] = useState<HistorySession[]>(MOCK_SESSIONS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 每次打开抽屉重置状态
  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditMode(false);
      setSelectedIds([]);
    }
  }, [visible]);

  // 切换选中状态
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  // 全选/取消全选
  // const toggleSelectAll = () => {
  //   if (selectedIds.length === sessions.length) {
  //     setSelectedIds([]);
  //   } else {
  //     setSelectedIds(sessions.map((s) => s.id));
  //   }
  // };

  // 删除选中
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      Toast.show("未选中历史记录");
      return;
    }

    Dialog.confirm({
      title: "确认删除",
      content: "是否删除多组对话，删除后不可恢复",
      confirmText: <span className="text-red-500">确认删除</span>,
      cancelText: "取消",
      onConfirm: () => {
        setSessions((prev) => {
          const next = prev.filter((s) => !selectedIds.includes(s.id));
          if (next.length === 0) {
            setIsEditMode(false);
          }
          return next;
        });
        setSelectedIds([]);
        Toast.show("删除成功");
      },
    });
  };

  // 清空全部
  const handleClearAll = () => {
    // 自动勾选所有条目
    setSelectedIds(sessions.map((s) => s.id));

    Dialog.confirm({
      title: "确认清空全部",
      content: "是否清空全部历史咨询记录",
      confirmText: <span className="text-red-500">确认清空</span>,
      cancelText: "取消",
      onConfirm: () => {
        setSessions([]);
        setSelectedIds([]);
        setIsEditMode(false);
        Toast.show("已清空");
      },
      onCancel: () => {
        // 取消时保持勾选状态，不取消勾选
      },
    });
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="right"
      bodyStyle={{ width: "85vw", backgroundColor: "#F5F5F7" }}
    >
      <div className="flex flex-col h-full relative">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="text-[17px] font-semibold text-gray-900">
            历史咨询
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
          {/* Banner */}
          <div className="bg-white rounded-[12px] p-3 flex items-center justify-between shadow-sm border border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="doctor" size={24} className="text-primary" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-gray-900">
                  小荷AI医生APP
                </div>
                <div className="text-[11px] text-gray-400">健康问题 随时问</div>
              </div>
            </div>
            <button className="bg-green-50 text-primary text-[12px] font-medium px-3 py-1.5 rounded-full">
              立即下载
            </button>
          </div>

          {/* 列表控制栏 */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] text-gray-400">近 30 天</span>
            {sessions.length > 0 && (
              <button
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  setSelectedIds([]);
                }}
                className="text-[13px] text-gray-500 font-medium"
              >
                {isEditMode ? "退出" : "删除"}
              </button>
            )}
          </div>

          {/* 列表 */}
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  if (isEditMode) {
                    toggleSelection(session.id);
                  } else {
                    onSelectSession?.(session.id);
                    onClose();
                  }
                }}
                className="bg-white rounded-[12px] p-4 shadow-sm active:bg-gray-50 transition-colors flex items-start gap-3 relative overflow-hidden"
              >
                {/* 编辑模式复选框 */}
                {isEditMode && (
                  <div className="shrink-0 pt-1">
                    <CustomCheckbox
                      checked={selectedIds.includes(session.id)}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-900 mb-1 truncate">
                    {session.title}
                  </div>
                  {session.summary && (
                    <div className="text-[13px] text-gray-400 truncate leading-relaxed">
                      {session.summary}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Icon name="cc-history" size={32} />
                <span className="text-xs">暂无历史记录</span>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 (仅编辑模式) */}
        {isEditMode && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around shadow-float pb-safe z-20">
            <button
              onClick={handleClearAll}
              className="flex flex-col items-center gap-1 text-gray-600 "
            >
              <Icon name="clear" size={28} />
              <span className="text-[16px] font-medium">清空全部</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="flex flex-col items-center gap-1 text-red-500 "
            >
              <Icon
                name="trash"
                size={24}
                className="text-red-500 font-medium"
              />
              <span className="text-[16px] font-medium">
                删除 {selectedIds.length > 0 ? selectedIds.length : ""}
              </span>
            </button>
          </div>
        )}
      </div>
    </Popup>
  );
}
