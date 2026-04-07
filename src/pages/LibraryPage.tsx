/** 图书馆页面说明 */
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/library";
import { BookCoverCard } from "@/components/BookCoverCard";
import { AddLibraryCard } from "@/components/AddLibraryCard";

interface Book {
  id: number;
  library_id: number | null;
  hash: string;
  title: string;
  path: string;
  file_size: number | null;
  page_count: number | null;
  cover_path: string | null;
  format: string;
  read_progress: number;
  is_favorite: boolean;
  added_at: number;
}

/**
 * 图书馆页面组件
 * @returns 渲染书籍列表和添加书库入口
 */
export function LibraryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  /**
   * 加载书籍列表
   */
  const loadBooks = useCallback(async () => {
    try {
      const result = await invoke<Book[]>("get_books");
      setBooks(result);
    } catch (e) {
      console.error("Failed to load books:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  /**
   * 处理添加书库逻辑
   */
  const handleAddLibrary = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择漫画文件夹",
      });

      if (!selected) return; // 用户取消选择

      setScanning(true);
      await invoke("add_library", { path: selected });
      await loadBooks();
    } catch (e) {
      console.error("Failed to add library:", e);
    } finally {
      setScanning(false);
    }
  }, [loadBooks]);

  // 根据搜索参数对书籍进行排序
  const sortedBooks = [...books].sort((a, b) => {
    switch (search.sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "added":
        return b.added_at - a.added_at;
      case "recent":
      default:
        return b.added_at - a.added_at;
    }
  });

  return (
    <div className="space-y-8">
      {/* 头部区域 */}
      <div className="section-rule flex flex-wrap items-end justify-between gap-6 pb-6">
        <div className="space-y-3">
          <div className="data-label">Local Archive</div>
          <h1 className="text-4xl font-semibold uppercase tracking-[0.08em] text-text-primary">
            书架
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-text-secondary">
            以档案目录的方式浏览本地漫画与电子书，保持快速检索、阅读续接与收藏管理。
          </p>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-px overflow-hidden border border-border bg-border text-right">
          <div className="bg-bg-surface-2 px-4 py-3">
            <div className="data-label">Volumes</div>
            <div className="data-value mt-2 text-2xl font-semibold">{books.length}</div>
          </div>
          <div className="bg-bg-surface-2 px-4 py-3">
            <div className="data-label">Status</div>
            <div className="data-value mt-2 text-sm font-medium uppercase tracking-[0.16em] text-accent">
              {scanning ? "Scanning" : "Idle"}
            </div>
          </div>
        </div>
      </div>

      {/* 书籍网格 */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,160px)] gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-[160px]">
              <div className="panel-frame w-full aspect-[2/3] skeleton rounded-[22px]" />
              <div className="mt-3 h-[14px] w-[78%] skeleton rounded" />
              <div className="mt-2 h-[12px] w-[46%] skeleton rounded" />
            </div>
          ))}
        </div>
      ) : sortedBooks.length === 0 ? (
        <div className="panel-frame surface-grid flex min-h-[420px] flex-col items-center justify-center gap-8 rounded-[var(--radius-lg)] px-8 py-16 text-center">
          <div>
            <div className="data-label mb-3">Empty Archive</div>
            <div className="text-2xl font-semibold text-text-primary">还没有添加任何书籍</div>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-text-secondary">
              选择一个本地漫画或电子书目录，Yomu 会为你建立可继续阅读的个人书库索引。
            </p>
          </div>
          <AddLibraryCard onClick={handleAddLibrary} disabled={scanning} />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,160px)] gap-6">
          {sortedBooks.map((book) => (
            <BookCoverCard
              key={book.id}
              hash={book.hash}
              title={book.title}
              format={book.format}
              pageCount={book.page_count}
              readProgress={book.read_progress}
              onClick={() => {
                navigate({
                  to: "/reader/$bookId",
                  params: { bookId: book.hash },
                  search: { page: book.read_progress, zoom: 1 },
                });
              }}
            />
          ))}
          <AddLibraryCard onClick={handleAddLibrary} disabled={scanning} />
        </div>
      )}
    </div>
  );
}
