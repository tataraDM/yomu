use tauri::Manager;
use tauri::State;

use crate::{db, scanner};

/// 添加库目录
#[tauri::command]
pub async fn add_library(
    app: tauri::AppHandle,
    state: State<'_, db::DbState>,
    path: String,
    scan_mode: Option<String>,
) -> Result<db::Library, String> {
    let mode = scan_mode.as_deref().unwrap_or("flat");
    let library_id = {
        let db = state.0.lock().map_err(|e| e.to_string())?;
        db::add_library(&db, &path, mode).map_err(|e| e.to_string())?
    };

    scan_library_inner(&app, &state, library_id, &path, mode).await?;

    let db = state.0.lock().map_err(|e| e.to_string())?;
    let libraries = db::get_all_libraries(&db).map_err(|e| e.to_string())?;
    libraries
        .into_iter()
        .find(|l| l.id == library_id)
        .ok_or_else(|| "Library not found after creation".to_string())
}

/// 删除库目录及其关联的书籍记录
#[tauri::command]
pub async fn remove_library(
    state: State<'_, db::DbState>,
    library_id: i64,
) -> Result<(), String> {
    let db = state.0.lock().map_err(|e| e.to_string())?;
    db::remove_library(&db, library_id).map_err(|e| e.to_string())
}

/// 扫描库目录
#[tauri::command]
pub async fn scan_library(
    app: tauri::AppHandle,
    state: State<'_, db::DbState>,
    library_id: i64,
    path: String,
    scan_mode: Option<String>,
) -> Result<usize, String> {
    let mode = scan_mode.as_deref().unwrap_or("flat");
    scan_library_inner(&app, &state, library_id, &path, mode).await
}

pub(crate) async fn scan_library_inner(
    app: &tauri::AppHandle,
    state: &tauri::State<'_, db::DbState>,
    library_id: i64,
    path: &str,
    scan_mode: &str,
) -> Result<usize, String> {
    let dir_path = std::path::PathBuf::from(path);
    let covers_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("covers");

    let scan_path = dir_path.clone();
    let covers = covers_dir.clone();
    let mode = scan_mode.to_string();
    let results = tokio::task::spawn_blocking(move || {
        use rayon::prelude::*;

        let files = scanner::scan_directory(&scan_path);
        log::info!("Found {} book files in {:?}", files.len(), scan_path);

        let processed: Vec<_> = files
            .par_iter()
            .filter_map(|file| {
                match scanner::process_book(file, &covers) {
                    Ok(book) => Some(book),
                    Err(e) => {
                        log::warn!("Failed to process {:?}: {}", file, e);
                        None
                    }
                }
            })
            .collect();

        let mut processed = processed;

        if mode == "folder" {
            scanner::assign_series_by_folder(&mut processed, &scan_path);
        } else {
            scanner::assign_series_names(&mut processed);
        }

        processed
    })
    .await
    .map_err(|e| e.to_string())?;

    let count = results.len();

    {
        let db = state.0.lock().map_err(|e| e.to_string())?;
        for book in &results {
            let cover_rel = format!("{}.webp", book.hash);
            if let Err(e) = db::upsert_book(
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
            ) {
                log::warn!("Failed to insert book '{}': {}", book.title, e);
            }
        }
        let _ = db::update_library_scan_time(&db, library_id);
    }

    log::info!("Scan complete: {} books imported from {:?}", count, path);
    Ok(count)
}
