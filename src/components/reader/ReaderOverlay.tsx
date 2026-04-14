import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReadingMode } from "@/stores/settings";

interface ReaderOverlayProps {
  mode: ReadingMode;
  isRTL: boolean;
  currentPage: number;
  totalPages: number;
  previewPage: number | null;
  onPrev: () => void;
  onNext: () => void;
}

/** 阅读器浮层元素：页码预览卡片与左右翻页箭头 */
export function ReaderOverlay({
  mode,
  isRTL,
  currentPage,
  totalPages,
  previewPage,
  onPrev,
  onNext,
}: ReaderOverlayProps) {
  return (
    <>
      <AnimatePresence>
        {previewPage !== null && (
          <motion.div
            key="page-preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="px-6 py-4 rounded-2xl bg-[#2a2a2c]/90 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-black/40">
              <span className="text-[28px] font-semibold text-white tabular-nums">{previewPage + 1}</span>
              <span className="text-[16px] text-white/40 ml-1">/ {totalPages}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode !== "scroll" && mode !== "flip" && (
        <>
          {currentPage > 0 && (
            <button
              onClick={isRTL ? onNext : onPrev}
              className="absolute left-3 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/10 bg-black/35 transition-colors hover:bg-black/55"
              aria-label={isRTL ? "下一页" : "上一页"}
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button
              onClick={isRTL ? onPrev : onNext}
              className="absolute right-3 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/10 bg-black/35 transition-colors hover:bg-black/55"
              aria-label={isRTL ? "上一页" : "下一页"}
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          )}
        </>
      )}
    </>
  );
}
