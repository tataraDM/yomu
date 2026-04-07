/** 书籍详情页说明 */
import { Route } from "@/routes/book.$bookId";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

/**
 * 书籍详情页组件
 * @returns 渲染书籍详情信息
 */
export function BookDetailPage() {
  const { bookId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate({ to: "/library" })}
        className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border hover:bg-bg-hover hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        返回书架
      </button>

      <div className="section-rule pb-6">
        <div className="data-label mb-3">Record</div>
        <h1 className="text-4xl font-semibold uppercase tracking-[0.08em] text-text-primary">
          书籍详情
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          为单本书籍预留信息总览、阅读统计与元数据编辑区域。
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="panel-frame rounded-[var(--radius-lg)] p-6">
          <div className="data-label">Identity</div>
          <div className="mt-3 text-xl font-medium text-text-primary">Book ID</div>
          <p className="mt-4 break-all font-mono text-sm leading-7 text-text-secondary">{bookId}</p>
          <p className="mt-6 text-sm leading-7 text-text-secondary">
            详情页的实际数据展示将在后续阶段接入，这里先统一整体视觉结构与信息层级。
          </p>
        </div>

        <div className="grid gap-4">
          <div className="panel-frame rounded-[20px] p-5">
            <div className="data-label">Reading</div>
            <div className="mt-3 text-lg font-medium text-text-primary">阅读进度</div>
            <p className="mt-2 text-sm leading-7 text-text-secondary">预留最近页码、继续阅读与阅读模式摘要。</p>
          </div>
          <div className="panel-frame rounded-[20px] p-5">
            <div className="data-label">Metadata</div>
            <div className="mt-3 text-lg font-medium text-text-primary">元数据</div>
            <p className="mt-2 text-sm leading-7 text-text-secondary">预留标题、标签、来源与文件信息展示区域。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
