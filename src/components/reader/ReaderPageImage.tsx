import { useEffect, useMemo, useState } from "react";
import { getPageUrl } from "@/lib/comic-url";
import type { ReadingMode, FitMode } from "@/stores/settings";

interface ReaderPageImageProps {
  bookHash: string;
  pageIndex: number;
  mode: ReadingMode;
  fitMode: FitMode;
  lazy?: boolean;
}

const loadedImageCache = new Set<string>();
const imageSizeCache = new Map<string, { w: number; h: number }>();

function getImageClasses(mode: ReadingMode, fitMode: FitMode, loaded: boolean): string {
  const opacityCls = mode === "scroll"
    ? loaded ? "opacity-100" : "opacity-0"
    : `transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`;

  if (mode === "scroll") {
    return `block w-full h-auto ${opacityCls}`;
  }

  switch (fitMode) {
    case "width":
      return `block w-full h-auto ${opacityCls}`;
    case "contain":
      return `block max-h-full max-w-full object-contain ${opacityCls}`;
    case "height":
    default:
      return `block h-full w-auto ${opacityCls}`;
  }
}

/** 单页/卷轴模式下的页面图片渲染组件 */
export function ReaderPageImage({ bookHash, pageIndex, mode, fitMode, lazy }: ReaderPageImageProps) {
  const url = getPageUrl(bookHash, pageIndex);
  const [loaded, setLoaded] = useState(() => loadedImageCache.has(url));
  const [error, setError] = useState(false);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(() => imageSizeCache.get(url) ?? null);

  useEffect(() => {
    setLoaded(loadedImageCache.has(url));
    setError(false);
    setImageSize(imageSizeCache.get(url) ?? null);
  }, [url]);

  const imgClasses = getImageClasses(mode, fitMode, loaded);
  const wrapperStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (mode !== "scroll" || !imageSize || imageSize.w === 0 || imageSize.h === 0) return undefined;
    return {
      aspectRatio: `${imageSize.w} / ${imageSize.h}`,
    };
  }, [mode, imageSize]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-[300px] h-[400px] bg-white/5 rounded-[var(--radius-sm)] text-white/30 text-sm">
        加载失败 · 第 {pageIndex + 1} 页
      </div>
    );
  }

  const loadingAttr = lazy ? "lazy" : "eager";
  const isWidthFit = fitMode === "width";
  const containerCls =
    mode === "scroll"
      ? "relative w-full flex items-center justify-center"
      : isWidthFit
        ? "relative w-full flex items-center justify-center"
        : "relative h-full w-full flex items-center justify-center";

  return (
    <div className={containerCls} style={wrapperStyle}>
      <img
        src={url}
        alt={`Page ${pageIndex + 1}`}
        loading={loadingAttr}
        className={imgClasses}
        onLoad={(e) => {
          const nextSize = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight };
          imageSizeCache.set(url, nextSize);
          setImageSize(nextSize);
          loadedImageCache.add(url);
          setLoaded(true);
        }}
        onError={() => setError(true)}
        draggable={false}
      />
      {!loaded && (
        <div className={`absolute inset-0 flex items-center justify-center ${mode === "scroll" ? "min-h-[50vh]" : ""}`}>
          <div className="bg-white/5 rounded-[var(--radius-sm)] animate-pulse w-[200px] h-[300px]" />
        </div>
      )}
    </div>
  );
}
