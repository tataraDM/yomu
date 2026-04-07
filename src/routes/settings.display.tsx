/** 显示设置路由说明 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/display")({
  component: DisplaySettings,
});

/**
 * 显示设置组件
 * @returns 渲染显示与性能相关的设置项
 */
function DisplaySettings() {
  return (
    <div className="space-y-8">
      <div className="section-rule pb-5">
        <div className="data-label mb-3">Display</div>
        <h2 className="text-3xl font-semibold uppercase tracking-[0.08em] text-text-primary">
          显示与性能
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          用于承载主题、缩放、动画与阅读显示策略的集中配置面板。
        </p>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
        <div className="bg-bg-surface-2 p-5">
          <div className="data-label">Theme</div>
          <div className="mt-3 text-lg font-medium text-text-primary">界面主题</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">保留当前档案馆深色风格，并为将来多主题切换预留位置。</p>
        </div>
        <div className="bg-bg-surface-2 p-5">
          <div className="data-label">Motion</div>
          <div className="mt-3 text-lg font-medium text-text-primary">动画节奏</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">预留过渡强度、减少动态效果与滚动表现选项。</p>
        </div>
        <div className="bg-bg-surface-2 p-5">
          <div className="data-label">Render</div>
          <div className="mt-3 text-lg font-medium text-text-primary">渲染策略</div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">后续可接入更细的缩放、预加载与性能相关偏好。</p>
        </div>
      </div>
    </div>
  );
}
