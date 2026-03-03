import { useMemo } from "react";
import { Button, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export default function OpenAppPage() {
  const navigate = useNavigate();
  const appLink = useAppStore((state) => state.config?.app_link);

  const downloadUrl = useMemo(() => {
    return appLink?.download_url || appLink?.yingyongbao_url || "";
  }, [appLink]);

  const handleCopy = async () => {
    if (!downloadUrl) {
      Toast.show("暂无下载链接");
      return;
    }

    try {
      await navigator.clipboard.writeText(downloadUrl);
      Toast.show("下载链接已复制");
    } catch {
      Toast.show("复制失败");
    }
  };

  const handleOpenStore = () => {
    if (!downloadUrl) {
      Toast.show("暂无下载链接");
      return;
    }
    window.location.href = downloadUrl;
  };

  const handleOpenApp = () => {
    if (!appLink?.scheme_url) {
      Toast.show("暂未配置打开方式");
      return;
    }
    window.location.href = appLink.scheme_url;
  };

  return (
    <div className="flex-1 bg-bg-page px-4 py-6 flex flex-col">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-sm text-gray-500"
      >
        返回
      </button>

      <div className="mt-8 rounded-[20px] bg-white p-5 shadow-sm border border-gray-100">
        <h1 className="text-[20px] font-semibold text-gray-900">
          打开小荷AI医生 App
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          如果当前环境无法直接唤起 App，可以前往应用商店下载安装，或复制下载链接后在浏览器中打开。
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button color="primary" block onClick={handleOpenApp}>
            打开 App
          </Button>
          <Button block onClick={handleOpenStore}>
            去下载
          </Button>
          <Button block fill="none" onClick={handleCopy}>
            复制下载链接
          </Button>
        </div>
      </div>
    </div>
  );
}
