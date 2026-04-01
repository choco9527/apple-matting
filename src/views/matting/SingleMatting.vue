<template>
    <div class="single-matting" ref="mattingEl">
        <!-- 上传区域 -->
        <div v-if="!imagePath" class="upload-zone" :class="{ 'is-dragging': isDragging }" @click="openFilePicker">
            <div class="upload-zone__inner">
                <el-icon class="upload-zone__icon">
                    <UploadFilled />
                </el-icon>
                <p class="upload-zone__title">{{ $t('single.uploadTitle') }}</p>
                <p class="upload-zone__hint">{{ $t('single.uploadHint') }}</p>
            </div>
        </div>

        <!-- 示例图片 -->
        <div v-if="!imagePath" class="demo-section">
            <p class="demo-section__title">{{ $t('single.demoTitle') }}</p>
            <div class="demo-section__list">
                <div v-for="(src, idx) in demoImages" :key="idx" class="demo-section__item"
                    @click="loadFromBase64(src)">
                    <img :src="src" />
                </div>
            </div>
        </div>

        <!-- 图片预览 / 效果对比（抠图后替换预览） -->
        <template v-if="imagePath">
            <div class="section-card">
                <div class="section-card__header">
                    <span class="section-card__title">{{ resultUrl ? $t('single.compareTitle') :
                        $t('single.previewTitle') }}</span>
                    <!-- 预览工具栏 -->
                    <div v-if="!resultUrl" class="section-card__tools">
                        <el-button size="small" @click="resetAll">
                            <el-icon>
                                <Refresh />
                            </el-icon> {{ $t('single.reselect') }}
                        </el-button>
                        <el-button type="primary" size="small" :loading="processing" :disabled="processing"
                            @click="runMatting">
                            <el-icon v-if="!processing">
                                <MagicStick />
                            </el-icon>
                            {{ processing ? $t('single.matting') : $t('single.startMatting') }}
                        </el-button>
                    </div>
                    <!-- 结果工具栏 -->
                    <div v-if="resultUrl" class="section-card__tools">
                        <el-button type="primary" size="small" @click="openEditor">
                            <el-icon>
                                <EditPen />
                            </el-icon> {{ $t('single.editResult') }}
                        </el-button>
                        <el-popover placement="bottom" :width="320" trigger="click" v-model:visible="showBgPicker">
                            <template #reference>
                                <el-button type="warning" size="small">
                                    <el-icon>
                                        <PictureFilled />
                                    </el-icon> {{ $t('single.setBg') }}
                                </el-button>
                            </template>
                            <div class="bg-picker">
                                <p class="bg-picker__label">{{ $t('single.baseColor') }}</p>
                                <div class="bg-picker__grid">
                                    <div v-for="c in presetColors" :key="c" class="bg-picker__swatch"
                                        :class="{ active: bgColor === c }" :style="getSwatchStyle(c)"
                                        @click="setBgColor(c)">
                                        <el-icon v-if="bgColor === c">
                                            <Check />
                                        </el-icon>
                                    </div>
                                </div>
                                <p class="bg-picker__label">{{ $t('single.gradientColor') }}</p>
                                <div class="bg-picker__grid">
                                    <div v-for="g in gradientColors" :key="g.name" class="bg-picker__swatch"
                                        :class="{ active: bgColor === g.value }" :style="{ background: g.value }"
                                        @click="setBgColor(g.value)">
                                        <el-icon v-if="bgColor === g.value">
                                            <Check />
                                        </el-icon>
                                    </div>
                                </div>
                            </div>
                        </el-popover>
                        <el-button type="info" size="small" @click="copyToClipboard">
                            <el-icon>
                                <DocumentCopy />
                            </el-icon> {{ $t('single.copyClipboard') }}
                        </el-button>
                        <el-button type="success" size="small" @click="saveResult">
                            <el-icon>
                                <Download />
                            </el-icon> {{ $t('single.saveResult') }}
                        </el-button>
                        <el-button size="small" @click="resetAll">
                            <el-icon>
                                <Refresh />
                            </el-icon> {{ $t('single.reselect') }}
                        </el-button>
                    </div>
                </div>

                <!-- 原图预览 -->
                <div v-if="!resultUrl && !processing" class="section-card__body">
                    <img :src="imageUrl" class="preview-img" />
                </div>

                <!-- 对比 / 加载中 -->
                <div v-else class="section-card__body section-card__body--compare"
                    :class="{ 'checkerboard-bg': isTransparentBg }">
                    <div v-if="processing" class="loading-placeholder">
                        <el-icon class="spin">
                            <Loading />
                        </el-icon>
                        <span>{{ $t('single.processing') }}</span>
                    </div>
                    <VueCompareImage v-else-if="displayResultUrl" :left-image="imageUrl" :right-image="displayResultUrl"
                        class="img-container" />
                </div>

            </div>

        </template>

        <!-- 编辑器弹窗 -->
        <el-dialog v-model="showEditor" fullscreen :destroy-on-close="true" :show-close="true" class="editor-dialog"
            :append-to-body="true">
            <ImgaeEditor :initial-base64="editorResultBase64" :origin-base64="editorOriginBase64"
                :initial-background="bgColor" @export-image="handleEditorExport" />
        </el-dialog>

        <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable class="error-alert"
            @close="errorMsg = ''" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    UploadFilled,
    Refresh,
    MagicStick,
    Download,
    PictureFilled,
    Loading,
    EditPen,
    DocumentCopy,
    Check,
} from '@element-plus/icons-vue'
import { VueCompareImage } from 'vue3-compare-image'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { writeFile, readFile, exists, mkdir } from '@tauri-apps/plugin-fs'
import { save } from '@tauri-apps/plugin-dialog'
import { downloadDir, join, appDataDir } from '@tauri-apps/api/path'
import { writeImage } from '@tauri-apps/plugin-clipboard-manager'
import { Image as TauriImage } from '@tauri-apps/api/image'
import { getImgFile } from '@/apis/base.js'
import { imageMattingAPI } from '@/apis/image.js'
import imageList from '@/utils/demo.js'
import ImgaeEditor from '@/components/ImageTool/ImgaeEditor.vue'
import { presetColors, gradientColors } from '@/config/colors.js'
import { ElMessage } from 'element-plus'

const { t } = useI18n()

// ─── Blob URL 管理 ──────────────────────────────────────────────────────────
const _blobUrls = []
let _prevDisplayUrl = ''

async function getCacheDir() {
    const d = await appDataDir()
    const p = await join(d, 'Cache')
    if (!(await exists(p))) {
        await mkdir(p, { recursive: true })
    }
    return p
}

async function pathToBlob(nativePath) {
    const ext = nativePath.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'png' ? 'image/png'
            : ext === 'webp' ? 'image/webp'
                : ext === 'bmp' ? 'image/bmp'
                    : 'image/png'
    const bytes = await readFile(nativePath)
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    _blobUrls.push(url)
    return url
}

function revokeDisplayUrl() {
    if (_prevDisplayUrl) {
        URL.revokeObjectURL(_prevDisplayUrl)
        _prevDisplayUrl = ''
    }
}

// ─── 示例图片 ───────────────────────────────────────────────────────────────
const demoImages = imageList.slice(0, 3)

// ─── State ──────────────────────────────────────────────────────────────────
const isDragging = ref(false)
const imagePath = ref('')
const imageUrl = ref('')
const resultPath = ref('')
const resultUrl = ref('')
const displayResultUrl = ref('')
const processing = ref(false)
const errorMsg = ref('')
const bgColor = ref('transparent')
const isTransparentBg = computed(() => !bgColor.value || bgColor.value === 'transparent')
const showBgPicker = ref(false)
const showEditor = ref(false)
const editorResultBase64 = ref('')
const editorOriginBase64 = ref('')
let _cachedOriginBase64 = ''
let _cachedResultBase64 = ''
let _cachedResultBlobUrl = ''

// ─── 图像合成（仅非 transparent 背景时调用） ─────────────────────────────────
function compositeOnBackground(imgUrl, color, format = 'image/jpeg', quality = 0.92) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')

            if (color.includes('gradient')) {
                applyGradient(ctx, canvas.width, canvas.height, color)
            } else {
                ctx.fillStyle = color
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.drawImage(img, 0, 0)
            canvas.toBlob((blob) => {
                resolve(URL.createObjectURL(blob))
            }, format, quality)
        }
        img.onerror = reject
        img.src = imgUrl
    })
}

function applyGradient(ctx, w, h, gradientStr) {
    try {
        const inner = gradientStr.match(/linear-gradient\((.+)\)/)[1]
        const parts = inner.split(/,\s*/)
        let angle = 180
        if (parts[0].includes('deg')) {
            angle = parseFloat(parts.shift())
        }
        const angleRad = (angle - 90) * (Math.PI / 180)
        const len = Math.abs(w * Math.cos(angleRad)) + Math.abs(h * Math.sin(angleRad))
        const cx = w / 2, cy = h / 2
        const gradient = ctx.createLinearGradient(
            cx - (Math.cos(angleRad) * len) / 2,
            cy - (Math.sin(angleRad) * len) / 2,
            cx + (Math.cos(angleRad) * len) / 2,
            cy + (Math.sin(angleRad) * len) / 2,
        )
        parts.forEach((c, i) => gradient.addColorStop(i / Math.max(parts.length - 1, 1), c.trim()))
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
    } catch {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
    }
}

function blobUrlToBase64(blobUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            canvas.getContext('2d').drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = reject
        img.src = blobUrl
    })
}

// ─── 监听结果 / 背景变化，更新对比显示 ──────────────────────────────────────
watch([resultUrl, bgColor], async ([url, color]) => {
    revokeDisplayUrl()
    if (!url) { displayResultUrl.value = ''; return }

    if (!color || color === 'transparent') {
        displayResultUrl.value = url
        return
    }

    const newUrl = await compositeOnBackground(url, color)
    _prevDisplayUrl = newUrl
    displayResultUrl.value = newUrl
}, { immediate: true })

// ─── 文件选择 ───────────────────────────────────────────────────────────────
async function openFilePicker() {
    try {
        const res = await getImgFile()
        if (res?.code === 200 && res.data?.selected_file) {
            await setImage(res.data.selected_file)
        }
    } catch (e) {
        errorMsg.value = `${t('single.errorOpen')}：${e?.message ?? String(e)}`
    }
}

// ─── Tauri 拖拽 ─────────────────────────────────────────────────────────────
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'bmp']
let unlistenDrop = null

async function setupDragDrop() {
    const appWindow = getCurrentWebviewWindow()
    unlistenDrop = await appWindow.onDragDropEvent((event) => {
        const { type } = event.payload
        if (type === 'enter' || type === 'over') { isDragging.value = true; return }
        if (type === 'leave' || type === 'cancelled') { isDragging.value = false; return }
        if (type === 'drop') {
            isDragging.value = false
            if (imagePath.value) return
            const paths = event.payload.paths ?? []
            if (paths.length === 0) return
            const filePath = paths[0]
            const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
            if (!ALLOWED_EXTS.includes(ext)) {
                errorMsg.value = t('single.supportFormat')
                return
            }
            setImage(filePath).catch(err => { errorMsg.value = String(err) })
        }
    })
}

// ─── 粘贴（Ctrl+V） ────────────────────────────────────────────────────────
async function handlePaste(e) {
    if (imagePath.value) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) { await loadFromBrowserFile(file); break }
        }
    }
}

async function loadFromBrowserFile(file) {
    errorMsg.value = ''
    try {
        const tmpName = `matting_tmp_${Date.now()}.${file.type.split('/')[1] || 'png'}`
        const cacheDir = await getCacheDir()
        const tmpPath = await join(cacheDir, tmpName)
        const buf = await file.arrayBuffer()
        await writeFile(tmpPath, new Uint8Array(buf))
        await setImage(tmpPath)
    } catch (e) {
        errorMsg.value = `${t('single.errorPaste')}：${e?.message ?? String(e)}`
    }
}

async function loadFromBase64(base64Str) {
    errorMsg.value = ''
    try {
        const match = base64Str.match(/^data:image\/(\w+);base64,(.+)$/)
        const ext = match?.[1] || 'png'
        const raw = match?.[2] || base64Str.replace(/^data:image\/\w+;base64,/, '')
        const binary = atob(raw)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

        const tmpName = `demo_${Date.now()}.${ext}`
        const cacheDir = await getCacheDir()
        const tmpPath = await join(cacheDir, tmpName)
        await writeFile(tmpPath, bytes)
        await setImage(tmpPath)
    } catch (e) {
        errorMsg.value = `${t('single.errorLoad')}：${e?.message ?? String(e)}`
    }
}

// ─── 设置图片 ───────────────────────────────────────────────────────────────
async function setImage(nativePath) {
    imagePath.value = nativePath
    resultPath.value = ''
    resultUrl.value = ''
    displayResultUrl.value = ''
    errorMsg.value = ''
    bgColor.value = 'transparent'
    _cachedOriginBase64 = ''
    _cachedResultBase64 = ''
    _cachedResultBlobUrl = ''
    imageUrl.value = await pathToBlob(nativePath)
    blobUrlToBase64(imageUrl.value).then(b64 => { _cachedOriginBase64 = b64 })
}

// ─── 执行抠图 ───────────────────────────────────────────────────────────────
async function runMatting() {
    if (!imagePath.value || processing.value) return
    processing.value = true
    errorMsg.value = ''
    resultPath.value = ''
    resultUrl.value = ''
    displayResultUrl.value = ''
    try {
        const cacheDir = await getCacheDir()
        const outName = `result_${Date.now()}_nobg.png`
        const outPath = await join(cacheDir, outName)
        const res = await imageMattingAPI({ inputPath: imagePath.value, outputPath: outPath })
        if (res.success && res.output_path) {
            resultPath.value = res.output_path
            resultUrl.value = await pathToBlob(res.output_path)
        } else {
            errorMsg.value = res.error ?? t('single.errorMattingUnk')
        }
    } catch (e) {
        errorMsg.value = `${t('single.errorMatting')}：${e?.message ?? String(e)}`
    } finally {
        processing.value = false
    }
}

// ─── 设置背景 ───────────────────────────────────────────────────────────────
function setBgColor(color) {
    bgColor.value = color
    showBgPicker.value = false
}

function getSwatchStyle(color) {
    if (color === 'transparent') {
        return {
            backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
            `,
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
        }
    }
    return { backgroundColor: color }
}

// ─── 编辑结果 ───────────────────────────────────────────────────────────────
async function openEditor() {
    if (!resultUrl.value) return
    if (!_cachedResultBase64 || _cachedResultBlobUrl !== resultUrl.value) {
        _cachedResultBase64 = await blobUrlToBase64(resultUrl.value)
        _cachedResultBlobUrl = resultUrl.value
    }
    if (!_cachedOriginBase64) {
        _cachedOriginBase64 = await blobUrlToBase64(imageUrl.value)
    }
    editorResultBase64.value = _cachedResultBase64
    editorOriginBase64.value = _cachedOriginBase64
    showEditor.value = true
}

async function handleEditorExport({ base64, backgroundColor }) {
    const res = await fetch(base64)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    _blobUrls.push(url)
    resultUrl.value = url
    resultPath.value = ''
    _cachedResultBase64 = base64
    _cachedResultBlobUrl = url
    if (backgroundColor && backgroundColor !== 'transparent') {
        bgColor.value = backgroundColor
    }
    showEditor.value = false
}

// ─── 导出用合成（按需生成高质量 PNG） ────────────────────────────────────────
async function getExportBytes() {
    if (isTransparentBg.value) {
        if (resultPath.value) return await readFile(resultPath.value)
        const res = await fetch(resultUrl.value)
        return new Uint8Array(await res.arrayBuffer())
    }
    const pngUrl = await compositeOnBackground(resultUrl.value, bgColor.value, 'image/png')
    const res = await fetch(pngUrl)
    const bytes = new Uint8Array(await res.arrayBuffer())
    URL.revokeObjectURL(pngUrl)
    return bytes
}

// ─── 复制到粘贴板 ──────────────────────────────────────────────────────────
async function copyToClipboard() {
    if (!resultUrl.value) return
    try {
        const bytes = await getExportBytes()
        const img = await TauriImage.fromBytes(bytes)
        await writeImage(img)
        ElMessage.success(t('single.successCopy'))
    } catch (e) {
        errorMsg.value = `${t('single.errorCopy')}：${e?.message ?? String(e)}`
    }
}

// ─── 保存结果 ───────────────────────────────────────────────────────────────
async function saveResult() {
    if (!resultUrl.value) return
    try {
        const bytes = await getExportBytes()
        const dl = await downloadDir()
        const defPath = await join(dl, `result_${Date.now()}.png`)
        const savePath = await save({
            defaultPath: defPath,
            filters: [{ name: 'PNG Image', extensions: ['png'] }],
        })
        if (savePath) {
            await writeFile(savePath, bytes)
            ElMessage.success(t('single.successSave'))
        }
    } catch (e) {
        errorMsg.value = `${t('single.errorSave')}：${e?.message ?? String(e)}`
    }
}

// ─── 重置 ───────────────────────────────────────────────────────────────────
function resetAll() {
    revokeDisplayUrl()
    imagePath.value = ''
    imageUrl.value = ''
    resultPath.value = ''
    resultUrl.value = ''
    displayResultUrl.value = ''
    errorMsg.value = ''
    processing.value = false
    bgColor.value = 'transparent'
    _cachedOriginBase64 = ''
    _cachedResultBase64 = ''
    _cachedResultBlobUrl = ''
}

// ─── 生命周期 ───────────────────────────────────────────────────────────────
onMounted(async () => {
    window.addEventListener('paste', handlePaste)
    await setupDragDrop()
})

onUnmounted(() => {
    window.removeEventListener('paste', handlePaste)
    if (unlistenDrop) { unlistenDrop(); unlistenDrop = null }
    revokeDisplayUrl()
    _blobUrls.forEach(u => URL.revokeObjectURL(u))
})
</script>

<style lang="scss" scoped>
.single-matting {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    gap: 20px;
    overflow-y: auto;
    overflow-x: hidden;
}

/* ── 上传区 ───────────────────────────────────────────────── */
.upload-zone {
    width: 100%;
    max-width: 420px;
    min-height: 210px;
    border: 2px dashed var(--el-border-color-darker, #c0c4cc);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);

    html.dark & {
        background: var(--el-bg-color-overlay);
    }

    &:hover,
    &.is-dragging {
        border-color: var(--el-color-primary, #409eff);
        background: rgba(64, 158, 255, 0.06);
        transform: scale(1.01);
        box-shadow: 0 8px 32px rgba(64, 158, 255, 0.12);

        html.dark & {
            background: var(--el-color-primary-light-9);
            box-shadow: var(--el-box-shadow-light);
        }
    }

    &__inner {
        text-align: center;
        user-select: none;
        pointer-events: none;
    }

    &__icon {
        font-size: 40px;
        color: var(--el-color-primary, #409eff);
        margin-bottom: 10px;
    }

    &__title {
        font-size: 14px;
        color: var(--el-text-color-primary);
    }

    &__hint {
        color: var(--el-text-color-secondary);
    }
}

/* ── 示例图片 ──────────────────────────────────────────────── */
.demo-section {
    width: 100%;
    max-width: 420px;
    text-align: center;

    &__title {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-bottom: 12px;
    }

    &__list {
        display: flex;
        justify-content: center;
        gap: 16px;
    }

    &__item {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.25s ease;
        background: rgba(255, 255, 255, 0.7);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

        html.dark & {
            background: var(--el-bg-color-overlay);
            box-shadow: var(--el-box-shadow-light);
        }

        &:hover {
            border-color: var(--el-color-primary, #409eff);
            transform: translateY(-4px);
            box-shadow: 0 6px 20px rgba(64, 158, 255, 0.18);

            html.dark & {
                box-shadow: var(--el-box-shadow);
            }
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }
}

/* ── 区块卡片 ──────────────────────────────────────────────── */
.section-card {
    width: 100%;
    flex-shrink: 0;
    border-radius: 12px;
    background: var(--card-bg);
    box-shadow: var(--el-box-shadow-light);
    overflow: hidden;

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid var(--el-border-color-light);
        flex-wrap: wrap;
        gap: 8px;
    }

    &__title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        white-space: nowrap;
    }

    &__tools {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    &__body {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    &__body--compare {
        padding: 0;
        width: 100%;

        :deep(> div) {
            width: 100%;

            img {
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
            }
        }
    }
}

.checkerboard-bg {
    background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0;
    background-color: var(--el-bg-color);
}

.preview-img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    display: block;
}

.img-container {
    max-width: 100%;
    max-height: 70vh;
    display: flex;
    justify-content: center;
    align-items: center;

    :deep(img) {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
}

/* ── 工具栏行 ──────────────────────────────────────────────── */
.toolbar-row {
    width: 100%;
    flex-shrink: 0;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
}

/* ── 背景选择器 ────────────────────────────────────────────── */
.bg-picker {
    &__label {
        font-size: 13px;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
        font-weight: 500;

        &:not(:first-child) {
            margin-top: 12px;
        }
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
    }

    &__swatch {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        cursor: pointer;
        border: 2px solid var(--el-border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
            transform: scale(1.08);
        }

        &.active {
            border-color: var(--el-color-primary, #409eff);
        }

        .el-icon {
            color: #fff;
            filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
        }
    }
}

/* ── 加载占位 ──────────────────────────────────────────────── */
.loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 300px;
    color: var(--el-text-color-secondary);
    font-size: 14px;

    .el-icon {
        font-size: 40px;
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.spin {
    animation: spin 1s linear infinite;
}

/* ── 编辑器弹窗 ────────────────────────────────────────────── */
.editor-dialog {
    :deep(.el-dialog) {
        display: flex;
        flex-direction: column;
    }

    :deep(.el-dialog__header) {
        flex-shrink: 0;
        padding: 12px 20px;
        margin: 0;
    }

    :deep(.el-dialog__body) {
        flex: 1;
        padding: 0;
        overflow: hidden;
        min-height: 0;
    }
}

.error-alert {
    width: 100%;
    margin-top: 4px;
}
</style>
