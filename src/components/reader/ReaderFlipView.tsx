/**
 * 仿真翻页视图
 * 使用 page-flip 库实现书页翻转效果，通过 canvas 渲染。
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { PageFlip } from "page-flip";
import { getPageUrl } from "@/lib/comic-url";
import type { ImageEnhanceOptions } from "@/stores/settings";
import { buildEnhanceFilter } from "./ReaderPageImage";

/** 外部可调用的翻页控制接口 */
export interface FlipControl {
  flipNext: () => void;
  flipPrev: () => void;
  turnToPage: (page: number) => void;
}

interface ReaderFlipViewProps {
  bookHash: string;
  totalPages: number;
  currentPage: number;
  imageEnhance?: ImageEnhanceOptions;
  onPageChange: (page: number) => void;
}

/**
 * 仿真翻页视图组件
 * 将 page-flip 的 canvas 实例包裹为 React 组件，
 * 并通过 ref 暴露 flipNext / flipPrev / turnToPage 方法给外部控制。
 */
export const ReaderFlipView = forwardRef<FlipControl, ReaderFlipViewProps>(
  function ReaderFlipView({ bookHash, totalPages, currentPage, imageEnhance, onPageChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pfRef = useRef<PageFlip | null>(null);
    const [ready, setReady] = useState(false);
    const pendingPage = useRef<number | null>(null);

    const imageUrls = useMemo(
      () => Array.from({ length: totalPages }, (_, i) => getPageUrl(bookHash, i)),
      [bookHash, totalPages],
    );

    const enhanceFilter = useMemo(() => buildEnhanceFilter(imageEnhance), [imageEnhance]);

    // 初始化 PageFlip 实例
    useEffect(() => {
      const el = containerRef.current;
      if (!el || totalPages === 0) return;

      // 根据容器尺寸计算合适的页面宽高
      const rect = el.getBoundingClientRect();
      const pageW = Math.round(rect.width / 2) || 400;
      const pageH = Math.round(rect.height) || 600;

      const pf = new PageFlip(el, {
        width: pageW,
        height: pageH,
        size: "stretch",
        maxWidth: pageW,
        minWidth: 200,
        maxHeight: pageH,
        minHeight: 300,
        drawShadow: true,
        flippingTime: 600,
        usePortrait: false,
        showCover: true,
        maxShadowOpacity: 0.35,
        autoSize: true,
        mobileScrollSupport: false,
        useMouseEvents: true,
        showPageCorners: true,
        startPage: currentPage,
      });

      pf.loadFromImages(imageUrls);
      pfRef.current = pf;

      pf.on("flip", (e) => {
        onPageChange(e.data);
      });

      pf.on("init", () => {
        setReady(true);
        // 若在 init 之前已有待跳转的页码，立即执行
        if (pendingPage.current !== null) {
          pf.turnToPage(pendingPage.current);
          pendingPage.current = null;
        }
      });

      return () => {
        try { pf.destroy(); } catch { /* noop */ }
        pfRef.current = null;
        setReady(false);
      };
      // 仅在 bookHash / totalPages 变化时重建实例
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookHash, totalPages]);

    // 当外部 currentPage 变化且与 PageFlip 内部不一致时同步
    useEffect(() => {
      const pf = pfRef.current;
      if (!pf) {
        pendingPage.current = currentPage;
        return;
      }
      if (!ready) {
        pendingPage.current = currentPage;
        return;
      }
      if (pf.getCurrentPageIndex() !== currentPage) {
        pf.turnToPage(currentPage);
      }
    }, [currentPage, ready]);

    // 暴露控制方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        flipNext: () => pfRef.current?.flipNext("bottom"),
        flipPrev: () => pfRef.current?.flipPrev("bottom"),
        turnToPage: (page: number) => {
          if (pfRef.current) {
            pfRef.current.turnToPage(page);
          } else {
            pendingPage.current = page;
          }
        },
      }),
      [],
    );

    // 当 imageEnhance 配置变化时更新 canvas 容器的 CSS filter
    const applyFilter = useCallback(
      (node: HTMLDivElement | null) => {
        if (!node) return;
        const canvas = node.querySelector("canvas");
        if (canvas) {
          canvas.style.filter = enhanceFilter ?? "";
        }
      },
      [enhanceFilter],
    );

    // 监听 filter 变化，实时应用
    useEffect(() => {
      if (!containerRef.current) return;
      const canvas = containerRef.current.querySelector("canvas");
      if (canvas) {
        canvas.style.filter = enhanceFilter ?? "";
      }
    }, [enhanceFilter]);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          applyFilter(node);
        }}
        className="flex-1 min-h-0 w-full relative"
        style={{ overflow: "hidden" }}
      />
    );
  },
);
