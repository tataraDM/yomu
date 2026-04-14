/** 阅读器预加载钩子模块 */

import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getPageUrl } from "@/lib/comic-url";

const PRELOAD_AHEAD = 6;
const PRELOAD_BEHIND = 3;
const MAX_PRELOADED = 50;

/**
 * 阅读器方向感知预加载钩子
 * 根据阅读方向预加载前后页面。
 * 使用浏览器原生的 Image 对象进行预加载，支持零拷贝。
 * 同时在后台预热 Rust 磁盘缓存。
 * @param bookHash 漫画哈希值
 * @param currentPage 当前页码
 * @param totalPages 总页数
 */
export function usePreloader(
  bookHash: string,
  currentPage: number,
  totalPages: number
) {
  const prevPage = useRef(currentPage);
  const preloadedSet = useRef(new Set<string>());

  useEffect(() => {
    if (totalPages === 0) return;

    const direction =
      currentPage >= prevPage.current ? "forward" : "backward";
    prevPage.current = currentPage;

    const pagesToPreload: number[] = [];
    const range =
      direction === "forward"
        ? { ahead: PRELOAD_AHEAD, behind: PRELOAD_BEHIND }
        : { ahead: PRELOAD_BEHIND, behind: PRELOAD_AHEAD };

    for (let i = 1; i <= range.ahead; i++) {
      const target =
        direction === "forward" ? currentPage + i : currentPage - i;
      if (target >= 0 && target < totalPages) pagesToPreload.push(target);
    }
    for (let i = 1; i <= range.behind; i++) {
      const target =
        direction === "forward" ? currentPage - i : currentPage + i;
      if (target >= 0 && target < totalPages) pagesToPreload.push(target);
    }

    for (const page of pagesToPreload) {
      const url = getPageUrl(bookHash, page);
      if (preloadedSet.current.has(url)) continue;
      const img = new Image();
      img.src = url;
      preloadedSet.current.add(url);
    }

    // 限制 set 大小，淘汰最早的条目
    if (preloadedSet.current.size > MAX_PRELOADED) {
      const entries = Array.from(preloadedSet.current);
      const toRemove = entries.slice(0, entries.length - MAX_PRELOADED);
      for (const url of toRemove) preloadedSet.current.delete(url);
    }

    invoke("warm_cache", {
      bookHash,
      pageIndices: pagesToPreload,
    }).catch(() => {
      // 静默忽略错误 — 缓存预热为最佳实践，非强制要求
    });
  }, [bookHash, currentPage, totalPages]);

  useEffect(() => {
    preloadedSet.current.clear();
  }, [bookHash]);
}
