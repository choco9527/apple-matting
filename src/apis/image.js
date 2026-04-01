import { invoke } from '@tauri-apps/api/core';

/**
 * 对单张图片执行抠图
 * @param {string} inputPath  - 输入图片的绝对路径
 * @param {string|null} outputPath - 输出路径（可选，默认在输入文件同目录生成 _nobg.png）
 * @returns {Promise<{success: boolean, output_path?: string, error?: string}>}
 */
export async function imageMattingAPI({ inputPath, outputPath = null }) {
    return invoke('process_single_image', {
        inputPath,
        outputPath,
    });
}
