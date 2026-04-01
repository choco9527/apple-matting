mod commands;
mod matting;

use commands::{process_batch_images, process_single_image};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            if let Ok(app_dir) = app.path().app_data_dir() {
                let cache_dir = app_dir.join("Cache");
                let _ = std::fs::remove_dir_all(&cache_dir); // clean previous session
                let _ = std::fs::create_dir_all(&cache_dir); // re-create empty
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            process_single_image,
            process_batch_images,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
