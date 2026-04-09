# Yomu 已知问题清单

> 本文件汇总全项目审阅中发现的问题，按严重程度排序。
> 标记含义：
> - 🔴 **P0** — 阻塞性问题，影响核心功能 / 数据安全 / 资源安全，必须尽快修复
> - 🟠 **P1** — 高优先级问题，显著影响体验或埋下隐患，建议同批修复
> - 🟡 **P2** — 次要问题、死代码、可改进项，等 P0/P1 清完再处理

---

## 🔴 P0-1 卷轴模式未虚拟化，大书卡死

- **位置**：`src/components/reader/ReaderViews.tsx:69-73`
- **现象**：`ReaderScrollView` 一次性 `Array.from({ length: totalPages }).map(...)` 渲染全部页面节点。500 页的漫画等于 500+ 个 `<div>` + 500 个 `<img>` 同时存在于 DOM。`loading="lazy"` 仅推迟图片请求，节点本身没有卸载。
- **附加问题**：`useReaderControls` 的 scroll 监听每帧遍历 `container.children` 算最近页，O(N) 代价被写进热路径。
- **影响**：任何 100 页以上的书打开卷轴模式即卡顿甚至挂起。卷轴模式是三大核心模式之一。
- **尴尬事实**：`package.json` 里已装好 `react-virtuoso@4.18.4`，但全项目从未 import 过。
- **建议修复**：用 `react-virtuoso` 的 `Virtuoso` 替换当前 map 渲染；或者用 `IntersectionObserver` 自行做 windowing。

---

## 🔴 P0-2 warm_cache 对非 JPEG/PNG/WebP/GIF 格式生成损坏缓存

- **位置**：`src-tauri/src/commands/cache.rs:89-97`、`152-158`
- **根因**：
  1. `detect_ext` 对无法识别的格式（BMP/TIFF/…）回落到 `"webp"`；
  2. `warm_cache` **不做转码**，把原始字节直接写成 `page_N.webp`；
  3. 下次请求命中 `read_cached_page`，扩展名映射出 MIME `image/webp`，但 body 其实是 BMP/TIFF。
- **影响**：响应头写着 `image/webp`，浏览器解码失败 → 该页永远加载不出来，除非清掉缓存。只要 `usePreloader` 跑过，就会触发。
- **对比**：`extract.rs::extract_and_maybe_transcode` 的按需路径会正确判断 `browser_native` 并转码。两条路径行为不一致。
- **建议修复**：`warm_cache` 走和 `extract_and_maybe_transcode` 相同的转码逻辑；或当 `detect_ext` 识别失败时，跳过写入该页的缓存。

---

## 🔴 P0-3 cleanup_cache 已注册但前端从未调用，磁盘无限膨胀

- **位置**：`src-tauri/src/runtime.rs:34`（已注册）；`src-tauri/src/commands/cache.rs:106`（已实现）
- **现象**：全局搜索 `cleanup_cache` 仅在后端两处出现，前端零引用。`usePreloader` 在每次翻页都会把前后若干页写入 `appData/cache/<hash>/`，无人清理。
- **影响**：读 50 本书就能写几个 GB 缓存；长期使用最终磁盘爆掉。
- **建议修复**：
  1. 启动时调用一次 `cleanup_cache(maxBytes=2GB)`（LRU 清理）；
  2. 在 `/settings/library` 里暴露"清理缓存"按钮。

---

## 🔴 P0-4 handle_page 每次图片请求都 spawn + join 一个 OS 线程

- **位置**：`src-tauri/src/protocol/handler.rs:77-89`
- **现象**：
  ```rust
  let result = std::thread::spawn(move || {
      extract_and_maybe_transcode(&book_info, &hash_owned, page_index, &cache_dir)
  }).join();
  ```
  `extract_and_maybe_transcode` 本身是同步的；spawn 之后立即 join，等价于直接调用。唯一"用处"是捕获 panic，`std::panic::catch_unwind` 就能做到。
- **影响**：在 cache miss 下，预热 + UI + 手动翻页叠加时每秒可能创建几十个 OS 线程。Windows 下线程/句柄配额压力显著，配合 P0-1 的卷轴卡顿更糟。
- **建议修复**：去掉 `std::thread::spawn`，直接调用；如需 panic 隔离，用 `std::panic::catch_unwind`。

---

## 🔴 P0-5 文件指纹碰撞风险（只 hash 前 64KB + size）

- **位置**：`src-tauri/src/scanner/hash.rs:8-22`
- **现象**：
  ```rust
  hasher.update(file_size.to_le_bytes());
  let mut buffer = vec![0u8; 65536.min(file_size as usize)];
  file.read(&mut buffer)?;
  hasher.update(&buffer[..bytes_read]);
  ```
  只哈希 `(size, 前 64KB)`。`hash` 又是 `books` 表的 `UNIQUE` 键，`upsert_book` 用 `ON CONFLICT(hash) DO UPDATE`。
- **影响**：两个体积相同、ZIP local-file-header 起始相似的 CBZ（漫画档案的常见情况）会哈希碰撞 → 第二个 upsert 静默覆盖第一个的记录 → 第一本书从书架上消失。**静默数据丢失**。
- **建议修复**：
  - 小文件（< 8MB）走全文件 SHA256；
  - 大文件采样多个偏移（开头 + 中间 + 结尾）；
  - 或以 `(canonical_path, size, mtime)` 作为去重主键，hash 只做辅助。

---

## 🟠 P1-1 save_progress 更新不存在的书时静默成功

- **位置**：`src-tauri/src/db/books.rs:97-103`
- **现象**：`db.execute(UPDATE ...)` 丢弃 `affected_rows`，0 行受影响仍然返回 `Ok(())`，前端以为保存成功。
- **影响**：重扫描把旧书标成 `is_removed=1` 时，用户的阅读进度会被默默丢掉。
- **建议修复**：检查受影响行数，0 行时返回错误或至少 `log::warn!`。

---

## 🟠 P1-2 useReaderControls 中的 sidebarCollapsed / toggleSidebar 是死代码

- **位置**：`src/stores/settings.ts:21,37`、`src/components/layout/AppShell.tsx:13`
- **现象**：`toggleSidebar` 只在 store 里定义，整个项目里**没有任何 UI 元素调用它**。侧边栏折叠功能存在于状态但用户无法触发。
- **影响**：功能不可达，user-facing 等同于 bug。
- **建议修复**：在 `TitleBar` 或 `Sidebar` 头部加一个折叠按钮，调用 `toggleSidebar`；或者干脆从 store 里删掉这段死代码。

---

## 🟠 P1-3 SPINE_CACHE 全局静态无上限、无过期

- **位置**：`src-tauri/src/protocol/spine.rs:6-7`
- **现象**：
  ```rust
  static SPINE_CACHE: LazyLock<Mutex<HashMap<String, Vec<String>>>> = ...;
  ```
  所有 EPUB 读过之后，spine 列表永远留在内存，没有 LRU、没有容量上限。
- **影响**：连续打开很多 EPUB 会累积内存。
- **建议修复**：用带上限的 LRU（如 `lru` crate），或基于 `book_hash` 的最近使用时间做淘汰。

---

## 🟠 P1-4 Cargo.toml 声明 `notify = "7"` 但源码从未使用

- **位置**：`src-tauri/Cargo.toml:31`
- **现象**：`notify` 是个文件系统监听 crate，依赖树里有它，但全项目没有一处 `use notify`。
- **推测**：原作者为"书库自动监听新增文件"留的占位，后来没做。
- **建议修复**：要么真的接入（按书库路径订阅变更事件），要么从 `Cargo.toml` 里移除以缩小构建产物。

---

## 🟠 P1-5 OPF 用 str::find 做 XML 解析

- **位置**：`src-tauri/src/scanner/epub/opf.rs`、`scanner/epub/spine.rs`
- **现象**：
  ```rust
  if let Some(pos) = content.find("full-path=\"") { ... }
  for line in opf.lines() { ... }
  ```
  手写的 line-based / 字符串 find 方法对 XML 的各种合法变体脆弱：
  - 属性值用单引号 → 找不到；
  - 属性跨行 → 找不到；
  - 注释或 CDATA 中含类似字符串 → 误匹配；
  - 命名空间前缀（如 `<opf:item>`）→ 匹配行为不一致。
- **影响**：部分 EPUB（特别是非英文出版社生成的）会扫不到封面或 spine，导致页数 = 1 / 无封面。
- **建议修复**：引入一个轻量 XML 解析器（`quick-xml` 或 `roxmltree`），或至少用 regex 覆盖双引号 / 单引号两种情况。

---

## 🟠 P1-6 books 表有 last_modified 列但从不写入

- **位置**：`src-tauri/src/db/schema.rs:36`、`src-tauri/src/db/books.rs::upsert_book`
- **现象**：`CREATE TABLE books (... last_modified INTEGER, ...)` 声明了该列，但 `upsert_book` 的 SQL 和参数列表里完全没有它。
- **影响**：后续做"增量扫描 / 仅扫描变化文件"时拿不到可用的 mtime，只能全量重扫。
- **建议修复**：扫描时从 `metadata().modified()?` 取出时间戳写入；重扫时用它做变化判断。

---

## 🟠 P1-7 useReaderControls 的 isExternalNavRef 有一行 no-op

- **位置**：`src/components/reader/useReaderControls.ts:197-202`
- **现象**：
  ```ts
  const handleUserGesture = () => {
    if (isExternalNavRef.current) {
      container.scrollTop = container.scrollTop;  // ← 没有任何副作用
      isExternalNavRef.current = false;
    }
  };
  ```
  `x = x` 形式的赋值被现代浏览器优化掉，不会触发重新布局或滚动停止。原作者意图不明。
- **影响**：外部导航（例如 slider 跳转）之后立刻被用户手势接管时，行为可能不符预期。
- **建议修复**：明确意图——若想强制打断平滑滚动，应调用 `container.scrollTo({ top: container.scrollTop, behavior: 'instant' })` 或直接把这一行删掉。

---

## 🟠 P1-8 没有 ErrorBoundary / notFoundComponent

- **位置**：`src/routes/__root.tsx`、`src/main.tsx`
- **现象**：根路由没有 ErrorBoundary；TanStack Router 也没配 `notFoundComponent`；任意渲染错误直接把整个应用打成白屏。
- **影响**：一个组件崩溃全部死亡，开发模式可能看 devtools，发布模式用户完全懵。
- **建议修复**：给 root route 加 `errorComponent`；为 router 配 `defaultNotFoundComponent`；给 `ReactDOM.createRoot` 的顶层加 ErrorBoundary。

---

## 🟠 P1-9 useReaderControls 在 bookId 切换时 state 不重置

- **位置**：`src/components/reader/useReaderControls.ts:29`
- **现象**：`const [currentPage, setCurrentPage] = useState(initialPage)` 的 initializer 只在 mount 时跑。TanStack Router 的 `/reader/$bookId` 在 param 变化时**不会重新 mount**，`currentPage` state 保留了上一本书的值。
- **影响**：从 reader A 直接深链跳到 reader B（不经过书架），能看到一瞬间的错页或越界。
- **建议修复**：
  - 给 `<ReaderPage>` 外层包一个 `key={bookId}` 强制重新 mount；
  - 或在组件内用 `useEffect(() => setCurrentPage(initialPage), [bookId, initialPage])` 显式重置。

---

## 🟠 P1-10 handleBack 与 unmount cleanup 重复保存进度

- **位置**：`src/components/reader/useReaderControls.ts:67-74`、`277-283`
- **现象**：按返回按钮会先 `invoke("save_reading_progress")` 一次，然后 navigate 触发组件卸载，`useEffect` 的 cleanup 再次 `invoke("save_reading_progress")`。
- **影响**：两次往返 IPC 调用写同一条记录。不影响正确性，是性能 / 代码清洁度问题。
- **建议修复**：移除 `handleBack` 里的显式 save，交给 cleanup 统一处理。

---

## 🟡 P2-1 ReaderPage 的 Book 接口与后端 Rust 结构体不一致

- **位置**：`src/components/reader/types.ts::BookInfo` 与 `src-tauri/src/db/models.rs::Book`
- **现象**：前端 `BookInfo` 只声明了 6 个字段，而后端序列化了 13+ 个字段。TypeScript 没做完整映射，便利是 optional 字段出错容易一声不吭。
- **建议修复**：在前端定义一个 `Book` 类型覆盖所有后端字段，复用到各页面。

---

## 🟡 P2-2 LibraryPage 直接内联 Book 接口定义

- **位置**：`src/pages/LibraryPage.tsx:10-23`
- **现象**：Book 接口在 LibraryPage 里重复定义一份，与其它地方不共享。
- **建议修复**：抽到 `src/types/book.ts` 或 `src/lib/types.ts`，所有页面共享。

---

## 🟡 P2-3 usePreloader 的 preloadedSet 无上限

- **位置**：`src/hooks/usePreloader.ts:25`
- **现象**：`preloadedSet.current = new Set<string>()`，一本书读完可能累积数百条；仅在切换书时清空。
- **影响**：500 页的书留 500 条字符串记录，算不上真正的内存泄漏，但可以更干净。
- **建议修复**：用 LRU 或环形缓冲代替；或定期按 `currentPage` 周围窗口裁剪。

---

## 🟡 P2-4 detect_ext / detect_mime 两处实现基本重复

- **位置**：`src-tauri/src/commands/cache.rs:152-158`、`src-tauri/src/protocol/extract.rs:75-92`
- **现象**：两处都写了几乎相同的"魔数识别"逻辑，规则却略有差异（cache.rs 回落到 "webp"，extract.rs 回落到 "application/octet-stream"）。这也是 P0-2 的根因之一。
- **建议修复**：抽出到 `src-tauri/src/scanner/image.rs` 或新建 `image_format.rs`，两处共用。修复 P0-2 时顺手做掉。

---

## 🟡 P2-5 main.tsx 的 adjustWindowSize 会产生启动闪烁

- **位置**：`src/main.tsx:58-64`
- **现象**：先 await `adjustWindowSize()`（会把 Tauri 窗口从 `tauri.conf.json` 里声明的 800×600 改成屏幕 80%），**之后**才开始 React 渲染。如果用户的默认显示器比较小或 DPR 奇怪，会看到一瞬间的"小窗 → 大窗 → 渲染完成"。
- **建议修复**：把 `tauri.conf.json` 里的初始窗口尺寸设为隐藏或透明，`adjustWindowSize` 之后再 `show()`；或直接在 Rust 端的 `setup` 钩子里算好尺寸并一次性设定。

---

## 🟡 P2-6 protocol 路径缺失鲁棒性验证

- **位置**：`src-tauri/src/protocol/handler.rs`
- **现象**：对 `book_hash` 不做任何格式校验（比如 `^[0-9a-f]{64}$`），直接拼到 `join()` 里。目前通过 segment 数限制避免了 `/` 形式的路径穿越，但这是隐式的。
- **影响**：后续如果 book_hash 的来源变多（比如用户手动触发链接），就可能漏防御。
- **建议修复**：在 `handle_cover` / `handle_page` 入口处做一次 hash 格式正则校验，不合法直接 400。

---

## 🟡 P2-7 ReaderToolbar 与 TitleBar 功能重复

- **位置**：`src/components/reader/ReaderToolbar.tsx:93-121`、`src/components/layout/TitleBar.tsx`
- **现象**：ReaderToolbar 里自己实现了一套最小化 / 最大化 / 关闭按钮，TitleBar 也有一套。阅读器在非全屏时顶部工具栏展示的是 ReaderToolbar 的按钮，而 TitleBar 组件本身被 `/reader/*` 路径跳过。
- **建议修复**：把窗口控制按钮抽成一个 `<WindowControls>` 组件，两处共用。

---

## 🟡 P2-8 阅读器图片数组用 `sr-only` 做预渲染

- **位置**：`src/components/reader/ReaderViews.tsx:193-203`
- **现象**：为提前加载相邻页，组件把预渲染图片放在 `<div className="sr-only">` 里。这个 class 的初衷是"屏幕阅读器可见、视觉隐藏"；用来做 image preloading 属于借用语义。
- **建议修复**：改成 `<link rel="preload" as="image">` 或用 `new Image()` 做预加载（和 `usePreloader` 统一风格）。

---

## 🟡 P2-9 TypeScript 版本 `^6.0.2` 可能不存在

- **位置**：`package.json:39`
- **现象**：`"typescript": "^6.0.2"`，截至一般认知 TS 主线仍在 5.x。若实际不存在会导致 `pnpm install` 失败。
- **建议修复**：确认实际可安装版本；若仓库 pnpm-lock 里锁的是 5.x，把声明同步到 5.x。

---

## 进行中 / 本次 PR 同步做的新功能

这些不是 bug，是本次 PR 带来的新能力，列出来便于 code review 时留意波及面：

- **FEAT-A** `/settings/library` 接入真正的书库管理 UI（列表 / 添加 / 重扫 / 删除）
- **FEAT-B** 扫描器识别"系列"——文件名以父文件夹名为前缀的漫画被聚合为同一系列，前端按系列折叠展示
- **FEAT-C** 新增 `remove_library` Tauri command
- **FEAT-D** 应用启动时对已保存的书库做一次静默重扫（发现外部新增的漫画文件）

---

## 处理优先级建议

1. **立刻做**（阻塞发布）：P0-1、P0-2、P0-3、P0-4、P0-5
2. **下一批**（v0.2）：P1-1、P1-8、P1-9、P1-6
3. **伴随修复**（做 P0 时顺带）：P1-5（修 OPF 解析顺便）、P2-4（抽出公共模块时顺便）
4. **清理**（有空再做）：剩余 P1 和所有 P2
