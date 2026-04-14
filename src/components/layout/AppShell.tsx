/** 应用外壳组件 */
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { HelpDialog, useFirstTimeHelp } from "@/components/HelpDialog";
import { useSettingsStore } from "@/stores/settings";
import { useAmbientStore } from "@/stores/ambient";

/**
 * 应用外壳组件
 * 负责应用的基础布局，包括标题栏、侧边栏和主内容显示区
 */
export function AppShell() {
  // 获取侧边栏折叠状态
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const ambientColor = useAmbientStore((s) => s.color);
  const { showHelp, setShowHelp } = useFirstTimeHelp();

  const ambientStyle = ambientColor
    ? {
        background: `radial-gradient(ellipse at 30% 20%, rgba(${ambientColor}, 0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(${ambientColor}, 0.10) 0%, transparent 50%)`,
      }
    : undefined;

  return (
    <div className="surface-grid flex h-screen flex-col overflow-hidden bg-bg-base text-text-primary">
      {/* 动态背景渐变层 */}
      {ambientColor && (
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-all duration-1000 ease-out"
          style={ambientStyle}
        />
      )}
      {/* 顶部标题栏 */}
      <TitleBar />
      <div className="relative z-[1] flex flex-1 overflow-hidden border-t border-[var(--color-border-strong)]/70">
        {/* 侧边栏 */}
        <Sidebar collapsed={sidebarCollapsed} onOpenHelp={() => setShowHelp(true)} />

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-5">
          <div className="panel-frame panel-frame-inner min-h-full rounded-[var(--radius-lg)] p-5 md:p-7">
            {/* 路由内容出口（带过渡动画） */}
            <AnimatedOutlet />
          </div>
        </main>
      </div>
      <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
