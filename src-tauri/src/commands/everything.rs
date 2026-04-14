use std::path::PathBuf;
use std::process::Command;

/// Everything 搜索结果
#[derive(serde::Serialize)]
pub struct EverythingResult {
    pub path: String,
    pub name: String,
    pub format: String,
}

/// 检查 Everything 是否可用
#[tauri::command]
pub async fn check_everything_available() -> Result<bool, String> {
    // 尝试在 PATH 中找到 es.exe，或在常见安装路径
    Ok(find_es_exe().is_some())
}

/// 使用 Everything 搜索本地漫画文件
#[tauri::command]
pub async fn search_everything(query: String) -> Result<Vec<EverythingResult>, String> {
    let es_path = find_es_exe()
        .ok_or_else(|| "Everything 命令行工具 (es.exe) 未找到。请安装 Everything 并确保 es.exe 在 PATH 中。".to_string())?;

    // 构建搜索表达式：用户查询 + 限定漫画格式
    let extensions = "ext:cbz;cbr;cb7;epub;mobi;zip;rar;7z";
    let search_query = if query.trim().is_empty() {
        extensions.to_string()
    } else {
        format!("{} {}", query, extensions)
    };

    let output = Command::new(&es_path)
        .args(["-n", "100", &search_query])
        .output()
        .map_err(|e| format!("执行 es.exe 失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Everything 搜索失败: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let results: Vec<EverythingResult> = stdout
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() { return None; }
            let path = PathBuf::from(line);
            let ext = path.extension()?.to_str()?.to_lowercase();
            let format = match ext.as_str() {
                "cbz" | "zip" => "cbz",
                "cbr" | "rar" => "cbr",
                "cb7" | "7z" => "cb7",
                "epub" => "epub",
                "mobi" => "mobi",
                _ => return None,
            };
            let name = path.file_stem()?.to_str()?.to_string();
            Some(EverythingResult {
                path: line.to_string(),
                name,
                format: format.to_string(),
            })
        })
        .collect();

    Ok(results)
}

/// 使用 Everything 搜索结果导入指定文件到书库
#[tauri::command]
pub async fn import_from_everything(
    app: tauri::AppHandle,
    state: tauri::State<'_, crate::db::DbState>,
    file_paths: Vec<String>,
) -> Result<usize, String> {
    use tauri::Manager;

    let covers_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("covers");

    // 获取或创建一个"外部导入"虚拟库
    let library_id = {
        let db = state.0.lock().map_err(|e| e.to_string())?;
        crate::db::add_library(&db, "__everything_imports__", "flat")
            .map_err(|e| e.to_string())?
    };

    let covers = covers_dir.clone();
    let paths: Vec<PathBuf> = file_paths.into_iter().map(PathBuf::from).collect();

    let results = tokio::task::spawn_blocking(move || {
        use rayon::prelude::*;

        paths.par_iter()
            .filter_map(|path| {
                match crate::scanner::process_book(path, &covers) {
                    Ok(book) => Some(book),
                    Err(e) => {
                        log::warn!("Failed to process {:?}: {}", path, e);
                        None
                    }
                }
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|e| e.to_string())?;

    let count = results.len();

    {
        let db = state.0.lock().map_err(|e| e.to_string())?;
        for book in &results {
            let cover_rel = format!("{}.webp", book.hash);
            let _ = crate::db::upsert_book(
                &db,
                library_id,
                &book.hash,
                &book.title,
                &book.path.to_string_lossy(),
                book.file_size,
                book.last_modified,
                book.page_count,
                &cover_rel,
                book.format.as_str(),
                book.series_name.as_deref(),
            );
        }
    }

    Ok(count)
}

/// 查找 es.exe（Everything 命令行工具）
fn find_es_exe() -> Option<PathBuf> {
    // 先检查 PATH
    if let Ok(output) = Command::new("where").arg("es.exe").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout);
            let first_line = path.lines().next()?.trim();
            if !first_line.is_empty() {
                return Some(PathBuf::from(first_line));
            }
        }
    }

    // 检查常见安装路径
    let candidates = [
        r"C:\Program Files\Everything\es.exe",
        r"C:\Program Files (x86)\Everything\es.exe",
    ];
    for candidate in &candidates {
        let path = PathBuf::from(candidate);
        if path.exists() {
            return Some(path);
        }
    }

    None
}
