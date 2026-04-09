/** 标题栏组件 */
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { WindowControls } from "./WindowControls";

/**
 * 标题栏组件
 * 提供窗口拖拽区域、侧边栏折叠按钮和窗口控制按钮
 */
export function TitleBar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggle = useSettingsStore((s) => s.toggleSidebar);

  return (
    <div
      className="drag-region section-rule flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border-strong)]/80 bg-[#0a0a0a]/92 px-4 select-none backdrop-blur-md"
    >
      {/* 左侧：侧边栏折叠 + 应用标题 */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="no-drag inline-flex h-8 w-8 items-center justify-center transition-colors duration-[var(--duration-fast)] hover:bg-bg-hover"
          aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} className="text-text-secondary" />
          ) : (
            <PanelLeftClose size={15} className="text-text-secondary" />
          )}
        </button>
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-text-tertiary">
          Archive Reader
        </span>
        <span className="text-sm font-semibold tracking-[0.18em] text-text-primary uppercase">
          Yomu
        </span>
      </div>

      {/* 窗口控制按钮 */}
      <WindowControls className="border-l border-border pl-2" />
    </div>
  );
}
