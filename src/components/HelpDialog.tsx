/** 帮助对话框 — 功能一览与常见问题 */
import { useState, useEffect } from "react";
import { X, BookOpen, FolderTree, Search, Palette, Crop, SkipForward, Eye, CloudUpload, HardDrive, Keyboard } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const HELP_SEEN_KEY = "yomu-help-seen";

/** 检查是否首次打开 */
export function useFirstTimeHelp() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(HELP_SEEN_KEY);
    if (!seen) {
      setShowHelp(true);
      localStorage.setItem(HELP_SEEN_KEY, "1");
    }
  }, []);

  return { showHelp, setShowHelp };
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4 bg-bg-surface border border-border rounded-[var(--radius-lg)] shadow-2xl shadow-black/40">
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-bg-surface border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Yomu 使用指南</h2>
            <p className="mt-1 text-sm text-text-secondary">高性能漫画与电子书阅读器</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 快速开始 */}
          <section>
            <SectionTitle>快速开始</SectionTitle>
            <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
              <li>前往 <b className="text-text-primary">设置 → 书库管理</b>，点击「添加书库目录」选择你的漫画文件夹</li>
              <li>Yomu 会自动扫描文件夹内的 CBZ/CBR/CB7/EPUB/MOBI 文件并提取封面</li>
              <li>在书架中点击封面即可开始阅读，阅读进度自动保存</li>
            </ol>
          </section>

          {/* 功能一览 */}
          <section>
            <SectionTitle>功能一览</SectionTitle>
            <div className="grid gap-3">
              <FeatureItem icon={BookOpen} title="四种阅读模式" desc="单页、双页、卷轴滚动、仿真翻页（模拟真实纸张翻转效果）" />
              <FeatureItem icon={FolderTree} title="文件夹导入" desc="选择包含多个子文件夹的目录，子文件夹自动识别为系列（如 Naruto/Vol01.cbz）" />
              <FeatureItem icon={Search} title="全盘搜索" desc="安装 Everything 后支持全盘搜索漫画文件并导入（需 es.exe 在 PATH 中）" />
              <FeatureItem icon={Eye} title="图像增强" desc="锐化、色彩增强、文字增强三个独立开关，使用 CSS filter 实时生效" />
              <FeatureItem icon={Crop} title="白边裁剪" desc="自动裁剪页面边缘的空白区域，让画面更紧凑" />
              <FeatureItem icon={SkipForward} title="自动续读" desc="到达最后一页时自动跳转到同系列的下一本（可在设置中关闭）" />
              <FeatureItem icon={Palette} title="自定义背景色" desc="阅读器工具栏底部可选择预设背景色或自定义调色盘" />
              <FeatureItem icon={CloudUpload} title="WebDAV 备份" desc="将阅读进度和书库索引备份到坚果云、Nextcloud 等 WebDAV 服务" />
              <FeatureItem icon={HardDrive} title="文件夹监控" desc="已添加的书库目录会自动监控，新增漫画文件即时导入" />
            </div>
          </section>

          {/* 快捷键 */}
          <section>
            <SectionTitle icon={Keyboard}>阅读器快捷键</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <KbdRow keys="← / A" action="上一页" />
              <KbdRow keys="→ / D" action="下一页" />
              <KbdRow keys="Space" action="下一页" />
              <KbdRow keys="Home / End" action="第一页 / 最后一页" />
              <KbdRow keys="F / F11" action="全屏切换" />
              <KbdRow keys="Esc" action="退出全屏或返回书架" />
            </div>
          </section>

          {/* 支持格式 */}
          <section>
            <SectionTitle>支持格式</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {["CBZ (ZIP)", "CBR (RAR)", "CB7 (7z)", "EPUB", "MOBI"].map((f) => (
                <span key={f} className="px-3 py-1 text-xs border border-border rounded bg-bg-surface-2 text-text-secondary">{f}</span>
              ))}
            </div>
          </section>

          {/* 常见问题 */}
          <section>
            <SectionTitle>常见问题</SectionTitle>
            <div className="space-y-4">
              <QAItem q="扫描速度很慢？" a="Yomu 使用多核并行扫描，首次导入需要提取封面和计算哈希。后续重扫会跳过已有封面，速度会快很多。" />
              <QAItem q="白天模式下输入框看不清？" a="已在最新版本修复。如果仍有问题，请检查是否使用了最新版本。" />
              <QAItem q="Everything 搜索按钮没出现？" a="需要安装 Everything (voidtools.com) 并确保 es.exe 在系统 PATH 中，或安装在默认路径。" />
              <QAItem q="仿真翻页模式鼠标拖不动？" a="仿真模式使用 canvas 渲染，确保总页数 ≥ 2。单页漫画会自动退回普通显示。" />
              <QAItem q="自动续读没生效？" a="自动续读仅在同系列（series_name 相同）的书之间生效。独立书籍不会自动跳转。可在设置中开关。" />
              <QAItem q="WebDAV 备份失败？" a="请检查：1) URL 是否以 / 结尾 2) 用户名密码是否正确 3) 坚果云请使用应用专用密码。" />
              <QAItem q="如何更新 Yomu？" a="目前需要手动下载新版本替换。GitHub Actions 自动发布功能即将上线。" />
            </div>
          </section>

          {/* 底部 */}
          <div className="pt-4 border-t border-border text-center text-xs text-text-muted">
            Yomu v0.1.0 · 可在侧边栏设置中随时打开此帮助
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<{ size?: number }> }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={16} />}
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-primary">{children}</h3>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 border border-border rounded bg-bg-surface-2/50">
      <Icon size={16} className="shrink-0 mt-0.5 text-accent" />
      <div>
        <div className="text-sm font-medium text-text-primary">{title}</div>
        <div className="text-xs text-text-secondary mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function KbdRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-text-secondary">{action}</span>
      <kbd className="px-2 py-0.5 text-xs bg-bg-surface-2 border border-border rounded text-text-primary font-mono">{keys}</kbd>
    </div>
  );
}

function QAItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-text-primary">{q}</div>
      <div className="mt-1 text-xs text-text-secondary leading-5">{a}</div>
    </div>
  );
}
