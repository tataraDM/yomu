/** 应用外壳组件 */
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { useSettingsStore } from "@/stores/settings";

/**
 * 应用外壳组件
 * 负责应用的基础布局，包括标题栏、侧边栏和主内容显示区
 */
export function AppShell() {
  // 获取侧边栏折叠状态
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);

  return (
    <div className="surface-grid flex h-screen flex-col overflow-hidden bg-bg-base text-text-primary">
      {/* 顶部标题栏 */}
      <TitleBar />
      <div className="flex flex-1 overflow-hidden border-t border-[var(--color-border-strong)]/70">
        {/* 侧边栏 */}
        <Sidebar collapsed={sidebarCollapsed} />

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-5">
          <div className="panel-frame min-h-full rounded-[var(--radius-lg)] p-5 md:p-7">
            {/* 路由内容出口（带过渡动画） */}
            <AnimatedOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
