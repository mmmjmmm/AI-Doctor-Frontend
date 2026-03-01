import { Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="flex flex-col h-screen w-screen bg-bg-page text-gray-900 font-sans overflow-hidden">
      {/* 
        AppShell 作为全局壳，处理最外层的布局约束
        在移动端通常是满屏，如果在 PC 端预览可能需要 max-w-md 限制
      */}
      <div className="h-full w-full max-w-md mx-auto bg-bg-page shadow-none sm:shadow-2xl relative flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
