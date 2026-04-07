/** 通用设置路由说明 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/general")({
  component: GeneralSettings,
});

/**
 * 通用设置组件
 * @returns 渲染通用设置项
 */
function GeneralSettings() {
  return (
    <div className="space-y-8">
      <div className="section-rule pb-5">
        <div className="data-label mb-3">General</div>
        <h2 className="text-3xl font-semibold uppercase tracking-[0.08em] text-text-primary">
          通用设置
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          未来将在这里放置启动行为、默认打开方式与应用级偏好设置。
        </p>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
        <div className="bg-bg-surface-2 p-5">
          <div className="data-label">Startup</div>
          <div className="mt-3 text-lg font-medium text-text-primary">启动行为</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">预留应用启动时恢复书库与最近阅读状态。</p>
        </div>
        <div className="bg-bg-surface-2 p-5">
          <div className="data-label">Behavior</div>
          <div className="mt-3 text-lg font-medium text-text-primary">默认行为</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">预留默认打开页、继续阅读策略与常用偏好。</p>
        </div>
      </div>
    </div>
  );
}
