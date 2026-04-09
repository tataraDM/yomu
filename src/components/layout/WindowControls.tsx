/** 窗口控制按钮组件：最小化 / 最大化 / 关闭 */
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

interface WindowControlsProps {
  className?: string;
}

export function WindowControls({ className = "" }: WindowControlsProps) {
  return (
    <div className={`no-drag flex items-center ${className}`}>
      <button
        onClick={() => appWindow.minimize()}
        className="inline-flex h-8 w-11 items-center justify-center transition-colors duration-[var(--duration-fast)] hover:bg-bg-hover"
        aria-label="最小化"
      >
        <Minus size={14} className="text-text-secondary" />
      </button>
      <button
        onClick={() => appWindow.toggleMaximize()}
        className="inline-flex h-8 w-11 items-center justify-center transition-colors duration-[var(--duration-fast)] hover:bg-bg-hover"
        aria-label="最大化"
      >
        <Square size={12} className="text-text-secondary" />
      </button>
      <button
        onClick={() => appWindow.close()}
        className="group inline-flex h-8 w-11 items-center justify-center transition-colors duration-[var(--duration-fast)] hover:bg-[#4a1f1f]"
        aria-label="关闭"
      >
        <X size={14} className="text-text-secondary group-hover:text-[#ffb4a8]" />
      </button>
    </div>
  );
}
