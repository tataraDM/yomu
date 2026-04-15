import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Maximize, Minimize, Settings, X } from "lucide-react";
import type {
  ReaderDirectionOption,
  ReaderFitOption,
  ReaderModeOption,
} from "./types";
import type { ReadingDirection, ReadingMode, FitMode } from "@/stores/settings";

/** 背景色预设 */
const BG_COLOR_PRESETS = [
  { value: "#000000", label: "纯黑" },
  { value: "#1a1a1a", label: "深灰" },
  { value: "#2c2c2c", label: "中灰" },
  { value: "#f5f0e8", label: "暖纸" },
  { value: "#e8dcc8", label: "泛黄" },
  { value: "#ffffff", label: "纯白" },
] as const;

interface ReaderToolbarProps {
  showToolbar: boolean;
  isFullscreen: boolean;
  bookTitle: string;
  displayPage: number;
  totalPages: number;
  progressPercent: number;
  mode: ReadingMode;
  direction: ReadingDirection;
  fitMode: FitMode;
  modeOptions: ReaderModeOption[];
  dirOptions: ReaderDirectionOption[];
  fitOptions: ReaderFitOption[];
  onBack: () => void;
  onToggleFullscreen: () => void;
  onSetMode: (value: ReadingMode) => void;
  onSetDirection: (value: ReadingDirection) => void;
  onSetFitMode: (value: FitMode) => void;
  onSliderInput: (e: React.FormEvent<HTMLInputElement>) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderMouseDown: () => void;
  onSliderMouseUp: (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => void;
  enhanceButtons: { key: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; active: boolean; onToggle: () => void }[];
  readerBgColor: string;
  onSetReaderBgColor: (color: string) => void;
}

/** 阅读器工具栏：顶部窗口控制 + 底部进度条 + 右侧设置面板 */
export function ReaderToolbar({
  showToolbar,
  isFullscreen,
  bookTitle,
  displayPage,
  totalPages,
  progressPercent,
  mode,
  direction,
  fitMode,
  modeOptions,
  dirOptions,
  fitOptions,
  onBack,
  onToggleFullscreen,
  onSetMode,
  onSetDirection,
  onSetFitMode,
  onSliderInput,
  onSliderChange,
  onSliderMouseDown,
  onSliderMouseUp,
  enhanceButtons,
  readerBgColor,
  onSetReaderBgColor,
}: ReaderToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);

  // 工具栏隐藏时自动关闭设置面板
  useEffect(() => {
    if (!showToolbar) setShowSettings(false);
  }, [showToolbar]);

  // Escape 键关闭设置面板（在捕获阶段拦截，优先于阅读器的 Escape 处理）
  useEffect(() => {
    if (!showSettings) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [showSettings]);

  return (
    <AnimatePresence>
      {showToolbar && (
        <>
          {/* ── 顶部栏 ── */}
          <motion.div
            key="toolbar-top"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 left-0 right-0 z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-linear-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={onBack}
                  className="shrink-0 inline-flex items-center justify-center w-16 h-16 rounded-md text-white/55 hover:text-white/80 hover:bg-white/6 border border-transparent hover:border-white/8 transition-colors"
                  aria-label="返回书架"
                >
                  <ArrowLeft size={30} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSettings((prev) => !prev)}
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-md transition-colors ${
                    showSettings
                      ? "bg-[rgba(200,155,99,0.15)] text-[#f0ddc5] border border-[rgba(200,155,99,0.3)]"
                      : "text-white/55 hover:text-white/80 hover:bg-white/6 border border-transparent hover:border-white/8"
                  }`}
                  aria-label="阅读设置"
                >
                  <Settings size={30} />
                </button>
                <button
                  onClick={onToggleFullscreen}
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-md transition-colors ${
                    isFullscreen
                      ? "bg-[rgba(200,155,99,0.15)] text-[#f0ddc5] border border-[rgba(200,155,99,0.3)]"
                      : "text-white/55 hover:text-white/80 hover:bg-white/6 border border-transparent hover:border-white/8"
                  }`}
                  aria-label={isFullscreen ? "退出全屏" : "全屏"}
                >
                  {isFullscreen ? <Minimize size={30} /> : <Maximize size={30} />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── 底部简化进度条 ── */}
          <motion.div
            key="toolbar-bottom"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 right-0 z-50"
          >
            <div className="reader-bottom-panel mx-4 mb-4 border border-[var(--color-border-strong)]/70 bg-[#12100f]/96 backdrop-blur-md">
              <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                <span className="max-w-[70%] truncate text-[13px] font-medium text-white/80">
                  {bookTitle}
                </span>
                <span className="font-mono text-[13px] text-white/50 tabular-nums">
                  {displayPage + 1} / {totalPages}
                </span>
              </div>
              <div className="px-4 pb-3">
                <input
                  type="range"
                  min={0}
                  max={Math.max(totalPages - 1, 0)}
                  value={displayPage}
                  onInput={onSliderInput}
                  onChange={onSliderChange}
                  onMouseDown={onSliderMouseDown}
                  onMouseUp={onSliderMouseUp}
                  onTouchStart={onSliderMouseDown}
                  onTouchEnd={onSliderMouseUp as unknown as React.TouchEventHandler}
                  className="w-full"
                  style={{ ["--progress" as string]: `${progressPercent}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* ── 右侧设置面板 ── */}
          <AnimatePresence>
            {showSettings && (
              <>
                {/* 遮罩层 */}
                <motion.div
                  key="settings-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-[55] bg-black/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(false);
                  }}
                />
                {/* 面板 */}
                <motion.div
                  key="settings-panel"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-0 right-0 bottom-0 z-[60] w-72 bg-[#12100f]/[0.98] backdrop-blur-xl border-l border-white/[0.08] overflow-y-auto reader-settings-panel"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 面板头部 */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
                    <span className="text-[15px] font-medium text-white/90">阅读设置</span>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-4 space-y-5">
                    {/* 阅读模式 */}
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.15em] text-white/35 mb-2">
                        阅读模式
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {modeOptions.map((opt) => {
                          const Icon = opt.icon;
                          const isActive = opt.value === mode;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => onSetMode(opt.value)}
                              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-colors ${
                                isActive
                                  ? "bg-[rgba(200,155,99,0.15)] text-[#f0ddc5] border border-[rgba(200,155,99,0.3)]"
                                  : "text-white/55 hover:text-white/80 hover:bg-white/6 border border-transparent"
                              }`}
                            >
                              <Icon size={18} strokeWidth={1.5} />
                              <span className="text-[10px] leading-none">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 翻页方向 */}
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.15em] text-white/35 mb-2">
                        翻页方向
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {dirOptions.map((opt) => {
                          const Icon = opt.icon;
                          const isActive = opt.value === direction;
                          const isDisabled = mode === "scroll";
                          return (
                            <button
                              key={opt.value}
                              onClick={() => !isDisabled && onSetDirection(opt.value)}
                              disabled={isDisabled}
                              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-colors ${
                                isDisabled
                                  ? "text-white/20 cursor-not-allowed border border-transparent"
                                  : isActive
                                    ? "bg-[rgba(200,155,99,0.15)] text-[#f0ddc5] border border-[rgba(200,155,99,0.3)]"
                                    : "text-white/55 hover:text-white/80 hover:bg-white/[0.06] border border-transparent"
                              }`}
                            >
                              <Icon size={18} strokeWidth={1.5} />
                              <span className="text-[10px] leading-none">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 图片适应 */}
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.15em] text-white/35 mb-2">
                        图片适应
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {fitOptions.map((opt) => {
                          const Icon = opt.icon;
                          const isActive = opt.value === fitMode;
                          const isDisabled = mode === "flip";
                          return (
                            <button
                              key={opt.value}
                              onClick={() => !isDisabled && onSetFitMode(opt.value)}
                              disabled={isDisabled}
                              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-colors ${
                                isDisabled
                                  ? "text-white/20 cursor-not-allowed border border-transparent"
                                  : isActive
                                    ? "bg-[rgba(200,155,99,0.15)] text-[#f0ddc5] border border-[rgba(200,155,99,0.3)]"
                                    : "text-white/55 hover:text-white/80 hover:bg-white/[0.06] border border-transparent"
                              }`}
                            >
                              <Icon size={18} strokeWidth={1.5} />
                              <span className="text-[10px] leading-none">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    {/* 图像增强 */}
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.15em] text-white/35 mb-2">
                        图像增强
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {enhanceButtons.map((btn) => {
                          const Icon = btn.icon;
                          return (
                            <button
                              key={btn.key}
                              onClick={btn.onToggle}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                                btn.active
                                  ? "bg-[rgba(200,155,99,0.15)] text-[#f0ddc5] border border-[rgba(200,155,99,0.3)]"
                                  : "text-white/55 hover:text-white/80 hover:bg-white/[0.06] border border-transparent"
                              }`}
                            >
                              <Icon size={16} strokeWidth={1.5} />
                              <span className="text-[11px]">{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    {/* 背景颜色 */}
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.15em] text-white/35 mb-2">
                        背景颜色
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {BG_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => onSetReaderBgColor(preset.value)}
                            title={preset.label}
                            className={`w-7 h-7 rounded-full border-2 transition-all shrink-0 ${
                              readerBgColor === preset.value
                                ? "border-[rgba(200,155,99,0.7)] scale-110"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            style={{ backgroundColor: preset.value }}
                          />
                        ))}
                        <div className="relative shrink-0">
                          <input
                            type="color"
                            value={readerBgColor}
                            onChange={(e) => onSetReaderBgColor(e.target.value)}
                            className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
                            title="自定义颜色"
                          />
                          <div
                            className={`w-7 h-7 rounded-full border-2 transition-all ${
                              BG_COLOR_PRESETS.some((p) => p.value === readerBgColor)
                                ? "border-white/20"
                                : "border-[rgba(200,155,99,0.7)] scale-110"
                            }`}
                            style={{
                              background: `conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
