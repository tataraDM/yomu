/** 搜索页面说明 */
import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/search";
import { Search as SearchIcon, X, Download, HardDrive } from "lucide-react";
import { BookCoverCard } from "@/components/BookCoverCard";
import type { Book } from "@/lib/types";

interface EverythingResult {
  path: string;
  name: string;
  format: string;
}

/**
 * 搜索页面组件
 * 支持库内搜索 + Everything 全盘搜索
 */
export function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState(search.q);
  const inputRef = useRef<HTMLInputElement>(null);
  const [everythingAvailable, setEverythingAvailable] = useState(false);
  const [everythingResults, setEverythingResults] = useState<EverythingResult[]>([]);
  const [everythingLoading, setEverythingLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    invoke<Book[]>("get_books").then(setAllBooks).catch(() => {});
    invoke<boolean>("check_everything_available").then(setEverythingAvailable).catch(() => {});
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const libraryResults = query.trim()
    ? allBooks.filter((b) => b.title.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const handleClear = useCallback(() => {
    setQuery("");
    setEverythingResults([]);
    setSelectedPaths(new Set());
    inputRef.current?.focus();
  }, []);

  const handleEverythingSearch = useCallback(async () => {
    if (!query.trim()) return;
    setEverythingLoading(true);
    try {
      const results = await invoke<EverythingResult[]>("search_everything", { query: query.trim() });
      // 过滤掉已在库中的文件
      const existingPaths = new Set(allBooks.map((b) => b.path.toLowerCase()));
      const filtered = results.filter((r) => !existingPaths.has(r.path.toLowerCase()));
      setEverythingResults(filtered);
    } catch (e) {
      console.error("Everything search failed:", e);
    } finally {
      setEverythingLoading(false);
    }
  }, [query, allBooks]);

  const toggleSelect = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedPaths.size === 0) return;
    setImporting(true);
    try {
      const count = await invoke<number>("import_from_everything", {
        filePaths: Array.from(selectedPaths),
      });
      if (count > 0) {
        const books = await invoke<Book[]>("get_books");
        setAllBooks(books);
        // 清除已导入的结果
        setEverythingResults((prev) => prev.filter((r) => !selectedPaths.has(r.path)));
        setSelectedPaths(new Set());
      }
    } catch (e) {
      console.error("Import failed:", e);
    } finally {
      setImporting(false);
    }
  }, [selectedPaths]);

  return (
    <div className="space-y-8">
      <div className="section-rule pb-6">
        <div className="data-label mb-3">Retrieval</div>
        <h1 className="text-4xl font-semibold uppercase tracking-[0.08em] text-text-primary">
          搜索
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          在书库中按标题搜索漫画与电子书。
          {everythingAvailable && " 支持 Everything 全盘搜索。"}
        </p>
      </div>

      <div className="panel-frame max-w-3xl rounded-[var(--radius-lg)] p-5 md:p-6">
        <div className="data-label mb-4">Query</div>
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={everythingAvailable ? "搜索书库或全盘…" : "搜索书籍标题…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && everythingAvailable) handleEverythingSearch();
            }}
            className="w-full border border-border bg-bg-surface-2 py-4 pl-12 pr-12 text-sm tracking-[0.03em] text-text-primary placeholder:text-text-muted focus:border-[var(--color-accent-border)] focus:outline-none"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {everythingAvailable && query.trim() && (
          <button
            onClick={handleEverythingSearch}
            disabled={everythingLoading}
            className="mt-3 inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-border hover:text-text-primary disabled:opacity-40"
          >
            <HardDrive size={14} />
            {everythingLoading ? "搜索中..." : "Everything 全盘搜索"}
          </button>
        )}
      </div>

      {/* 库内搜索结果 */}
      {query.trim() && (
        <div className="space-y-4">
          <div className="text-sm text-text-secondary">
            {libraryResults.length > 0
              ? `书库内找到 ${libraryResults.length} 个结果`
              : "书库内没有找到匹配的书籍"}
          </div>
          {libraryResults.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,160px)] gap-6">
              {libraryResults.map((book) => (
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
            </div>
          )}
        </div>
      )}

      {/* Everything 搜索结果 */}
      {everythingResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              全盘搜索找到 {everythingResults.length} 个未导入文件
            </div>
            {selectedPaths.size > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 border border-accent-border bg-accent-light px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent/20 disabled:opacity-40"
              >
                <Download size={14} />
                {importing ? "导入中..." : `导入 ${selectedPaths.size} 个文件`}
              </button>
            )}
          </div>
          <div className="space-y-1">
            {everythingResults.map((result) => (
              <label
                key={result.path}
                className={`flex items-center gap-3 px-4 py-3 border transition-colors cursor-pointer ${
                  selectedPaths.has(result.path)
                    ? "border-accent/40 bg-accent/5"
                    : "border-border hover:border-border hover:bg-bg-hover"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPaths.has(result.path)}
                  onChange={() => toggleSelect(result.path)}
                  className="accent-[var(--color-accent)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary truncate">{result.name}</div>
                  <div className="text-[11px] text-text-tertiary truncate">{result.path}</div>
                </div>
                <span className="shrink-0 px-2 py-0.5 text-[10px] rounded bg-bg-surface-2 text-text-secondary border border-border">
                  {result.format.toUpperCase()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
