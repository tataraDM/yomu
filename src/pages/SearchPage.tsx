/** 搜索页面说明 */
import { Route } from "@/routes/search";
import { Search as SearchIcon } from "lucide-react";

/**
 * 搜索页面组件
 * @returns 渲染搜索界面
 */
export function SearchPage() {
  const search = Route.useSearch();

  return (
    <div className="space-y-8">
      <div className="section-rule pb-6">
        <div className="data-label mb-3">Retrieval</div>
        <h1 className="text-4xl font-semibold uppercase tracking-[0.08em] text-text-primary">
          搜索
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          为后续的全局检索、标签过滤与快速打开预留统一入口。
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
            type="text"
            placeholder="搜索书籍、作者、标签…"
            defaultValue={search.q}
            className="w-full border border-border bg-[#0d0d0d] py-4 pl-12 pr-4 text-sm tracking-[0.03em] text-text-primary placeholder:text-text-muted focus:border-[var(--color-accent-border)] focus:outline-none"
          />
        </div>
        <p className="mt-4 text-sm leading-7 text-text-secondary">
          搜索功能将在后续阶段实现，当前页面先完成视觉框架与输入体验。
        </p>
      </div>
    </div>
  );
}
