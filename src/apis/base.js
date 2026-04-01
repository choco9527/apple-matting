import { open, save } from '@tauri-apps/plugin-dialog';
import { writeFile, readFile } from '@tauri-apps/plugin-fs';
import { downloadDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

export const getImgFile = async () => {
    const selected = await open({
        multiple: false,
        directory: false,
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }
        ]
    })
    return {
        code: 200,
        data: {
            selected_file: selected,
            image_url: convertFileSrc(selected)
        }
    }
}

const getFileName = async (name, extension) => {
    const fileName = `${name}-${Date.now()}.${extension.toLowerCase()}`
    const downloadDirPath = await downloadDir();
    const defaultPath = await join(downloadDirPath, fileName);
    const path = await save({
        defaultPath,
        filters: [
            {
                name: 'Image',
                extensions: [extension],
            },
        ],
    });
    return path
}

function getBaseFileName(path) {
    // 步骤1：提取文件名
    const fileName = path.replace(/^.*[\\\/]/, '');
    // 步骤2：去除后缀
    return fileName.replace(/\.[^.]+$/, '');
}
// data
// {base64_data: resultUrl.value,
// extension: exportFormat.value,
// file_name: imagePath.value,
// hex_color: selectedColor.value,
// origin_image: imagePath.value || imageUrl.value,
// dpi: dpi.value
// }
export const saveImageDiage = async (data) => {
    const loadImage = (src) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    try {
        const mainImage = await loadImage(data.base64_data);

        const scaleFactor = data.dpi ? data.dpi / 96 : 1;
        canvas.width = mainImage.width * scaleFactor;
        canvas.height = mainImage.height * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor);

        const isJpg = ['jpg', 'jpeg'].includes(data.extension.toLowerCase());
        let backgroundColor = data.hex_color;

        if (isJpg) {
            if (!backgroundColor || backgroundColor === 'transparent') {
                backgroundColor = '#ffffff';
            }
        }

        if (backgroundColor && backgroundColor !== 'transparent') {
            if (backgroundColor.startsWith('linear-gradient')) {
                try {
                    const params = backgroundColor.match(/linear-gradient\((.+)\)/)[1].split(/,\s*/);
                    let angle = 180; // Default angle (to bottom)
                    let colors;

                    if (params[0].includes('deg')) {
                        angle = parseFloat(params.shift());
                        colors = params;
                    } else {
                        colors = params;
                    }

                    const w = mainImage.width;
                    const h = mainImage.height;
                    const angleRad = (angle - 90) * (Math.PI / 180);

                    const x0 = w / 2;
                    const y0 = h / 2;

                    const len = Math.abs(w * Math.cos(angleRad)) + Math.abs(h * Math.sin(angleRad));
                    const x1 = x0 - (Math.cos(angleRad) * len) / 2;
                    const y1 = y0 - (Math.sin(angleRad) * len) / 2;
                    const x2 = x0 + (Math.cos(angleRad) * len) / 2;
                    const y2 = y0 + (Math.sin(angleRad) * len) / 2;

                    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

                    colors.forEach((color, index) => {
                        const position = colors.length === 1 ? 0.5 : index / (colors.length - 1);
                        gradient.addColorStop(position, color);
                    });

                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, w, h);
                } catch (e) {
                    console.error("Failed to parse or apply gradient. Using fallback.", e);
                    ctx.fillStyle = '#ffffff'; // Fallback to white on error
                    ctx.fillRect(0, 0, mainImage.width, mainImage.height);
                }
            } else {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, mainImage.width, mainImage.height);
            }
        }
        console.log(data.background_image)
        if (data.background_image) {
            const imageBytes = await readFile(data.background_image);
            const extension = data.background_image.split('.').pop().toLowerCase();
            const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            const blob = new Blob([imageBytes], { type: mimeType });
            const bgImageSrc = URL.createObjectURL(blob);
            const bgImage = await loadImage(bgImageSrc);

            // 调整背景图片大小以适应原图 (object-fit: cover)
            const mainWidth = mainImage.width;
            const mainHeight = mainImage.height;
            const bgWidth = bgImage.width;
            const bgHeight = bgImage.height;

            const mainAspectRatio = mainWidth / mainHeight;
            const bgAspectRatio = bgWidth / bgHeight;

            let drawWidth, drawHeight, drawX, drawY;

            // 这里使用 "fill" 模式，确保背景覆盖整个图片
            if (bgAspectRatio > mainAspectRatio) {
                // 背景图片更宽，按高度缩放
                drawHeight = mainHeight;
                drawWidth = bgWidth * (mainHeight / bgHeight);
                drawX = (mainWidth - drawWidth) / 2; // 居中
                drawY = 0;
            } else {
                // 背景图片更高，按宽度缩放
                drawWidth = mainWidth;
                drawHeight = bgHeight * (mainWidth / bgWidth);
                drawX = 0;
                drawY = (mainHeight - drawHeight) / 2; // 居中
            }

            // 居中裁剪
            ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
            URL.revokeObjectURL(bgImageSrc);
        }

        ctx.drawImage(mainImage, 0, 0);
        let origin_name = 'result'
        try {
            origin_name = getBaseFileName(data.origin_image)
            console.log(origin_name)
        } catch (error) {
        }

        const filePath = await getFileName(origin_name, data.extension);
        if (!filePath) {
            return { code: 400, message: 'Save cancelled by user.' };
        }

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, `image/${data.extension.toLowerCase()}`)
        );

        if (!blob) {
            return { code: 500, message: 'Failed to create image blob.' };
        }

        const arrayBuffer = await blob.arrayBuffer();
        await writeFile(filePath, new Uint8Array(arrayBuffer));

        return { code: 200, message: 'Image saved successfully.' };
    } catch (error) {
        console.error('Failed to save image:', error);
        return { code: 500, message: `Failed to save image: ${error.message}` };
    }
}
