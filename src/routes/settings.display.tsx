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
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">显示与性能</h2>
      <p className="text-sm text-text-secondary">显示与性能设置将在后续阶段继续补充。</p>
    </div>
  );
}
