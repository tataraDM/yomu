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
        className={`flex min-w-[60px] flex-col items-center gap-1 border px-3 py-2 transition-colors ${
          disabled
            ? "border-transparent text-white/20 cursor-not-allowed"
            : open
              ? "border-[rgba(200,155,99,0.42)] bg-[rgba(200,155,99,0.12)] text-[#f0ddc5]"
              : "border-transparent text-white/60 hover:border-white/[0.08] hover:text-white/90 hover:bg-white/[0.04]"
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
            className="absolute bottom-full left-1/2 z-[60] mb-2 min-w-[132px] -translate-x-1/2 overflow-hidden border border-white/[0.08] bg-[#191716] py-1 shadow-lg shadow-black/40"
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
                      ? "bg-[rgba(200,155,99,0.1)] text-[#f0ddc5]"
                      : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <OptIcon size={16} strokeWidth={1.5} />
                  <span>{opt.label}</span>
                  {isActive && <span className="ml-auto text-[11px] text-[#f0ddc5]">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
