import { useState } from "react";
import { Popup, Dialog, Toast } from "antd-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import clsx from "clsx";
import { getHistoryList, batchDeleteHistory } from "@/api/history";

interface HistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
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
}: HistoryDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. 获取历史列表
  const { data, isLoading } = useQuery({
    queryKey: ["historyList"],
    queryFn: () => getHistoryList({ days: 30 }),
    enabled: visible, // 仅在可见时加载
  });

  const sessions = data?.sessions || [];

  // 2. 删除 Mutation
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => batchDeleteHistory(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historyList"] });
      Toast.show({
        content: "删除成功",
        icon: "success",
      });
      setIsEditMode(false);
      setSelectedIds([]);
    },
    onError: () => {
      Toast.show({
        content: "删除失败",
        icon: "fail",
      });
    },
  });

  // 切换选中状态
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

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
        deleteMutation.mutate(selectedIds);
      },
    });
  };

  // 清空全部
  const handleClearAll = () => {
    // 这里我们简单地先全选当前已加载的，或者调用专门的清空接口？
    // API 提供了 batch_delete，我们可以先遍历所有已加载的 id。
    // 如果要完全清空，可能需要后端支持 clear_all 参数，或者前端不断加载并删除。
    // 这里先实现为“清空当前列表所有项”。
    const allIds = sessions.map((s) => s.session_id);
    if (allIds.length === 0) return;

    Dialog.confirm({
      title: "确认清空全部",
      content: "是否清空全部历史咨询记录",
      confirmText: <span className="text-red-500">确认清空</span>,
      cancelText: "取消",
      onConfirm: () => {
        deleteMutation.mutate(allIds);
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
            {isLoading && sessions.length === 0 ? (
              <div className="text-center text-gray-400 py-4">加载中...</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => {
                    if (isEditMode) {
                      toggleSelection(session.session_id);
                    } else {
                      navigate(`/chat/${session.session_id}`, {
                        state: { historyNavNonce: Date.now() },
                        replace: false,
                      });
                      onClose();
                    }
                  }}
                  className="bg-white rounded-[12px] p-4 shadow-sm active:bg-gray-50 transition-colors flex items-start gap-3 relative overflow-hidden"
                >
                  {/* 编辑模式复选框 */}
                  {isEditMode && (
                    <div className="shrink-0 pt-1">
                      <CustomCheckbox
                        checked={selectedIds.includes(session.session_id)}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-gray-900 mb-1 truncate">
                      {session.title || "新会话"}
                    </div>
                    {session.last_message && (
                      <div className="text-[13px] text-gray-400 truncate leading-relaxed">
                        {session.last_message}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-300 mt-1">
                      {new Date(session.last_time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}

            {!isLoading && sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Icon name="cc-history" size={32} />
                <span className="text-xs">暂无历史记录</span>
              </div>
            )}

            {/* <InfiniteScroll loadMore={async () => { await fetchNextPage() }} hasMore={!!hasNextPage} /> */}
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
