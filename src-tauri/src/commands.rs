use serde::{Deserialize, Serialize};
use tauri::command;

use crate::matting::perform_matting;

// ─── Response types ──────────────────────────────────────────────────────────

/// Result of a single-image matting operation.
#[derive(Serialize, Deserialize, Debug)]
pub struct MattingResult {
    /// Whether the operation succeeded.
    pub success: bool,
    /// Absolute path of the output PNG (only set on success).
    pub output_path: Option<String>,
    /// Human-readable error message (only set on failure).
    pub error: Option<String>,
}

/// Result of one item inside a batch matting operation.
#[derive(Serialize, Deserialize, Debug)]
pub struct BatchItemResult {
    /// The original input path that was requested.
    pub input_path: String,
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

// ─── Tauri Commands ──────────────────────────────────────────────────────────

/// Process a single image: remove its background and return the output path.
///
/// Called from the frontend with:
/// ```ts
/// import { invoke } from '@tauri-apps/api/core';
/// const result = await invoke<MattingResult>('process_single_image', {
///   inputPath: '/absolute/path/to/photo.jpg',
///   outputPath: null, // optional, defaults to <name>_nobg.png next to input
/// });
/// ```
#[command]
pub async fn process_single_image(
    input_path: String,
    output_path: Option<String>,
) -> MattingResult {
    let out = output_path.as_deref();
    match perform_matting(&input_path, out) {
        Ok(path) => MattingResult {
            success: true,
            output_path: Some(path),
            error: None,
        },
        Err(e) => MattingResult {
            success: false,
            output_path: None,
            error: Some(e.to_string()),
        },
    }
}

/// Process multiple images concurrently: remove backgrounds in bulk.
///
/// Each item specifies an `input_path` and an optional `output_path`.
/// Items that fail do NOT abort the rest of the batch.
///
/// Called from the frontend with:
/// ```ts
/// import { invoke } from '@tauri-apps/api/core';
/// const results = await invoke<BatchItemResult[]>('process_batch_images', {
///   items: [
///     { inputPath: '/path/img1.jpg', outputPath: null },
///     { inputPath: '/path/img2.png', outputPath: '/custom/out.png' },
///   ],
/// });
/// ```
#[derive(Deserialize, Debug)]
pub struct BatchInputItem {
    pub input_path: String,
    pub output_path: Option<String>,
}

#[command]
pub async fn process_batch_images(items: Vec<BatchInputItem>) -> Vec<BatchItemResult> {
    use std::sync::{Arc, Mutex};
    use std::thread;

    let results: Arc<Mutex<Vec<BatchItemResult>>> = Arc::new(Mutex::new(Vec::new()));
    let mut handles = Vec::new();

    for item in items {
        let results_clone = Arc::clone(&results);
        let input = item.input_path.clone();
        let output = item.output_path.clone();

        let handle = thread::spawn(move || {
            let out = output.as_deref();
            let item_result = match perform_matting(&input, out) {
                Ok(path) => BatchItemResult {
                    input_path: input.clone(),
                    success: true,
                    output_path: Some(path),
                    error: None,
                },
                Err(e) => BatchItemResult {
                    input_path: input.clone(),
                    success: false,
                    output_path: None,
                    error: Some(e.to_string()),
                },
            };

            results_clone.lock().unwrap().push(item_result);
        });

        handles.push(handle);
    }

    for h in handles {
        let _ = h.join();
    }

    Arc::try_unwrap(results)
        .ok()
        .and_then(|m| m.into_inner().ok())
        .unwrap_or_default()
}
