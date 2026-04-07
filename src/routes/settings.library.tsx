/** 书库设置路由说明 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/library")({
  component: LibrarySettings,
});

/**
 * 书库设置组件
 * @returns 渲染书库管理相关的设置项
 */
function LibrarySettings() {
  return (
    <div className="space-y-8">
      <div className="section-rule pb-5">
        <div className="data-label mb-3">Indexing</div>
        <h2 className="text-3xl font-semibold uppercase tracking-[0.08em] text-text-primary">
          书库管理
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          聚合目录扫描、索引刷新与元数据管理的操作入口。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel-frame rounded-[20px] p-5">
          <div className="data-label">Libraries</div>
          <div className="mt-3 text-lg font-medium text-text-primary">书库来源</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">后续将在这里展示已添加目录、扫描时间与状态。</p>
        </div>
        <div className="panel-frame rounded-[20px] p-5">
          <div className="data-label">Metadata</div>
          <div className="mt-3 text-lg font-medium text-text-primary">索引与元数据</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">预留封面刷新、清理缓存与书籍信息更新的操作面板。</p>
        </div>
      </div>
    </div>
  );
}
