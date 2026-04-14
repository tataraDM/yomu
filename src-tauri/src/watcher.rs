use std::path::PathBuf;
use std::sync::mpsc;
use std::time::Duration;

use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{Emitter, Manager};

use crate::{db, scanner};

/// 启动文件系统监控，监视所有已注册的书库目录
/// 当发现新的漫画文件时，自动处理并导入到数据库
pub fn start_watcher(app: &tauri::AppHandle) {
    let handle = app.clone();

    std::thread::spawn(move || {
        let (tx, rx) = mpsc::channel();

        let mut watcher = match RecommendedWatcher::new(tx, Config::default().with_poll_interval(Duration::from_secs(5))) {
            Ok(w) => w,
            Err(e) => {
                log::error!("Failed to create file watcher: {}", e);
                return;
            }
        };

        // 获取所有库路径并开始监视
        let libraries = {
            let db_state: Option<tauri::State<db::DbState>> = handle.try_state();
            let Some(db_state) = db_state else { return; };
            let Ok(db) = db_state.0.lock() else { return; };
            db::get_all_libraries(&db).unwrap_or_default()
        };

        for lib in &libraries {
            let path = PathBuf::from(&lib.path);
            if path.exists() {
                if let Err(e) = watcher.watch(&path, RecursiveMode::Recursive) {
                    log::warn!("Failed to watch {:?}: {}", path, e);
                }  else {
                    log::info!("Watching library: {:?}", path);
                }
            }
        }

        if libraries.is_empty() {
            log::info!("No libraries to watch");
            return;
        }

        // 事件处理循环
        let mut pending_files: Vec<PathBuf> = Vec::new();
        let mut last_process = std::time::Instant::now();

        loop {
            match rx.recv_timeout(Duration::from_secs(2)) {
                Ok(Ok(event)) => {
                    match event.kind {
                        EventKind::Create(_) | EventKind::Modify(_) => {
                            for path in event.paths {
                                if path.is_file() && scanner::scan_directory(path.parent().unwrap_or(&path))
                                    .iter()
                                    .any(|p| p == &path)
                                {
                                    if !pending_files.contains(&path) {
                                        log::info!("New file detected: {:?}", path);
                                        pending_files.push(path);
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
                Ok(Err(e)) => {
                    log::warn!("Watch error: {}", e);
                }
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    // 超时 — 处理积累的文件
                }
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    log::info!("File watcher channel disconnected, stopping");
                    break;
                }
            }

            // 批量处理：积累 3 秒后统一处理
            if !pending_files.is_empty() && last_process.elapsed() > Duration::from_secs(3) {
                process_new_files(&handle, &mut pending_files, &libraries);
                last_process = std::time::Instant::now();
            }
        }
    });
}

/// 处理新发现的文件
fn process_new_files(
    app: &tauri::AppHandle,
    files: &mut Vec<PathBuf>,
    libraries: &[db::Library],
) {
    if files.is_empty() {
        return;
    }

    let covers_dir = match app.path().app_data_dir() {
        Ok(d) => d.join("covers"),
        Err(_) => return,
    };

    let db_state: Option<tauri::State<db::DbState>> = app.try_state();
    let Some(db_state) = db_state else { return; };

    let mut imported = 0;

    for file in files.drain(..) {
        // 找到文件所属的库
        let lib = libraries.iter().find(|l| {
            file.starts_with(&l.path)
        });
        let Some(lib) = lib else { continue; };

        match scanner::process_book(&file, &covers_dir) {
            Ok(mut book) => {
                // 文件夹模式时按目录名分配系列
                if lib.scan_mode == "folder" {
                    let lib_root = std::path::Path::new(&lib.path);
                    if let Some(parent) = file.parent() {
                        if parent != lib_root {
                            book.series_name = parent.file_name()
                                .and_then(|n| n.to_str())
                                .map(|s| s.to_string());
                        }
                    }
                }

                let Ok(db) = db_state.0.lock() else { continue; };
                let cover_rel = format!("{}.webp", book.hash);
                if let Err(e) = db::upsert_book(
                    &db,
                    lib.id,
                    &book.hash,
                    &book.title,
                    &book.path.to_string_lossy(),
                    book.file_size,
                    book.last_modified,
                    book.page_count,
                    &cover_rel,
                    book.format.as_str(),
                    book.series_name.as_deref(),
                ) {
                    log::warn!("Failed to insert auto-detected book: {}", e);
                } else {
                    imported += 1;
                    log::info!("Auto-imported: {} ({})", book.title, book.format.as_str());
                }
            }
            Err(e) => {
                log::warn!("Failed to process auto-detected file {:?}: {}", file, e);
            }
        }
    }

    if imported > 0 {
        log::info!("Auto-import complete: {} new books", imported);
        // 通知前端刷新
        let _ = app.emit("books-updated", imported);
    }
}
