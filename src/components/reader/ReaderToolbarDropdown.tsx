import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ReaderOption } from "./types";

interface ReaderToolbarDropdownProps<T extends string> {
  icon: ReaderOption<T>["icon"];
  label: string;
  options: ReaderOption<T>[];
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** 阅读器工具栏下拉按钮 */
export function ReaderToolbarDropdown<T extends string>({
  icon: Icon,
  label,
  options,
  value,
  onChange,
  open,
  onToggle,
  disabled,
}: ReaderToolbarDropdownProps<T>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
          disabled
            ? "text-white/20 cursor-not-allowed"
            : open
              ? "text-blue-400 bg-white/[0.08]"
              : "text-white/60 hover:text-white/90 hover:bg-white/[0.06]"
        }`}
      >
        <Icon size={18} strokeWidth={1.5} />
        <span className="text-[10px] leading-none">{label}</span>
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[120px] py-1 rounded-xl bg-[#3a3a3c] border border-white/[0.08] shadow-lg shadow-black/40 overflow-hidden z-[60]"
          >
            {options.map((opt) => {
              const OptIcon = opt.icon;
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
                    isActive
                      ? "text-blue-400 bg-white/[0.06]"
                      : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <OptIcon size={16} strokeWidth={1.5} />
                  <span>{opt.label}</span>
                  {isActive && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
