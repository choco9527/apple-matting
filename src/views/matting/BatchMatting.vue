<template>
  <div class="batch-matting">
    <div v-if="!inputDir" class="header-section">
      <el-alert :title="$t('batch.title')" :description="$t('batch.description')" type="info" show-icon
        :closable="false" class="info-alert" />
    </div>

    <!-- 上传/选择文件夹区域 -->
    <div v-if="!inputDir" class="upload-zone" @click="selectInputDir">
      <div class="upload-zone__inner">
        <el-icon class="upload-zone__icon">
          <FolderOpened />
        </el-icon>
        <p class="upload-zone__title">{{ $t('batch.selectInput') }}</p>
        <p class="upload-zone__hint">{{ $t('batch.selectInputHint') }}</p>
      </div>
    </div>

    <!-- 列表视图与操作栏 -->
    <template v-else>
      <div class="control-panel section-card">
        <div class="panel-row">
          <span class="label">{{ $t('batch.inputDir') }}</span>
          <el-input v-model="inputDir" readonly class="path-input">
            <template #append>
              <el-button @click="selectInputDir">{{ $t('batch.reselect') }}</el-button>
            </template>
          </el-input>
        </div>
        <div class="panel-row">
          <span class="label">{{ $t('batch.outputDir') }}</span>
          <el-input v-model="outputDir" readonly :placeholder="$t('batch.outputDirHint')" class="path-input">
            <template #append>
              <el-button @click="selectOutputDir">{{ $t('batch.selectPath') }}</el-button>
            </template>
          </el-input>
        </div>

        <div class="panel-actions">
          <div class="stats-group">
            <div class="stat-card stat-total">
              <span class="stat-label">{{ $t('batch.total') }}</span>
              <span class="stat-value">{{ imageList.length }}</span>
            </div>
            <div class="stat-card stat-pending">
              <span class="stat-label">{{ $t('batch.pending') }}</span>
              <span class="stat-value">{{ pendingCount }}</span>
            </div>
            <div class="stat-card stat-success">
              <span class="stat-label">{{ $t('batch.success') }}</span>
              <span class="stat-value">{{ successCount }}</span>
            </div>
            <div class="stat-card stat-fail">
              <span class="stat-label">{{ $t('batch.fail') }}</span>
              <span class="stat-value">{{ failCount }}</span>
            </div>
            <div class="stat-progress" v-if="imageList.length > 0">
              <el-progress type="dashboard" :percentage="progressPercentage" :width="54" :stroke-width="4"
                :color="progressColor">
                <template #default="{ percentage }">
                  <span class="progress-text">{{ percentage }}%</span>
                </template>
              </el-progress>
            </div>
          </div>
          <div class="actions-group">
            <el-button v-if="!isProcessing && pendingCount > 0" type="primary" @click="startProcessing">
              <el-icon>
                <VideoPlay />
              </el-icon> {{ $t('batch.start') }}
            </el-button>
            <el-button v-else-if="isProcessing" type="warning" @click="pauseProcessing">
              <el-icon>
                <VideoPause />
              </el-icon> {{ $t('batch.pause') }}
            </el-button>
            <el-button v-else type="success" disabled>
              <el-icon>
                <Check />
              </el-icon> {{ $t('batch.complete') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 图片瀑布流列表 -->
      <div class="list-container section-card">
        <div class="list-header">
          <span class="col-img">{{ $t('batch.previewImg') }}</span>
          <span class="col-path">{{ $t('batch.previewPath') }}</span>
          <span class="col-status">{{ $t('batch.previewStatus') }}</span>
        </div>

        <div class="scroll-wrapper" v-infinite-scroll="loadMore" :infinite-scroll-disabled="disableScroll"
          :infinite-scroll-distance="50">
          <div v-for="(item, index) in displayList" :key="index" class="list-item">
            <div class="col-img">
              <el-image :src="item.thumbnailUrl" class="thumbnail" fit="contain" loading="lazy"
                @click.stop="openImageLocation(item, false)" style="cursor: pointer;" :title="$t('batch.openOriginal')">
                <template #error>
                  <div class="image-slot"><el-icon>
                      <Picture />
                    </el-icon></div>
                </template>
              </el-image>
              <el-image v-if="item.resultUrl" :src="item.resultUrl" class="thumbnail result-thumbnail checkerboard-bg"
                fit="contain" loading="lazy" @click.stop="openImageLocation(item, true)" style="cursor: pointer;"
                title="打开结果图所在位置">
                <template #error>
                  <div class="image-slot"><el-icon>
                      <Picture />
                    </el-icon></div>
                </template>
              </el-image>
            </div>
            <div class="col-path">
              <div class="path-text" :title="item.relativePath">{{ item.relativePath }}</div>
            </div>
            <div class="col-status">
              <el-tag :type="getStatusType(item.status)" class="status-tag">
                {{ $t(`batch.status.${item.status}`) }}
              </el-tag>
              <el-tooltip v-if="item.error" :content="item.error" placement="top">
                <el-icon class="error-icon">
                  <Warning />
                </el-icon>
              </el-tooltip>
            </div>
          </div>

          <div v-if="!disableScroll && imageList.length > 0" class="loading-more">{{ $t('batch.loadMore') }}</div>
          <div v-if="disableScroll && imageList.length > 0" class="loading-more">{{ $t('batch.noMore') }}</div>
          <div v-if="imageList.length === 0 && !isScanning" class="empty-list">{{ $t('batch.emptyList') }}</div>
          <div v-if="isScanning" class="empty-list">{{ $t('batch.scanning') }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpened, VideoPlay, VideoPause, Picture, Warning, Check } from '@element-plus/icons-vue'
import { open } from '@tauri-apps/plugin-dialog'
import { readDir, exists, mkdir } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/core'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { imageMattingAPI } from '@/apis/image.js'
import { ElMessage } from 'element-plus'

const { t } = useI18n()

// --- State ---
const inputDir = ref('')
const outputDir = ref('')
const isScanning = ref(false)
const imageList = ref([])

// Pagination / Virtual Scroll (Waterfall)
const displayCount = ref(20)
const displayList = computed(() => imageList.value.slice(0, displayCount.value))
const disableScroll = computed(() => displayCount.value >= imageList.value.length)

// Processing State
const isProcessing = ref(false)
const isPaused = ref(false)
const MAX_CONCURRENT = 3
let activeTasks = 0

// Stats
const pendingCount = computed(() => imageList.value.filter(i => i.status === 'pending').length)
const successCount = computed(() => imageList.value.filter(i => i.status === 'success').length)
const failCount = computed(() => imageList.value.filter(i => i.status === 'fail').length)

const progressPercentage = computed(() => {
  if (imageList.value.length === 0) return 0
  const done = successCount.value + failCount.value
  return Math.floor((done / imageList.value.length) * 100)
})

const progressColor = [
  { color: '#909399', percentage: 0 },
  { color: '#409eff', percentage: 40 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#67c23a', percentage: 100 },
]

// --- Methods ---

function loadMore() {
  if (!disableScroll.value) {
    displayCount.value += 20
  }
}

function getStatusType(status) {
  switch (status) {
    case 'pending': return 'info'
    case 'processing': return 'primary'
    case 'success': return 'success'
    case 'fail': return 'danger'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'success': return '已完成'
    case 'fail': return '失败'
    default: return '未知'
  }
}

async function openImageLocation(item, isResult = false) {
  try {
    let pathToOpen = item.fullPath;
    if (isResult && item.status === 'success' && item.outputPath) {
      pathToOpen = item.outputPath;
    }
    await revealItemInDir(pathToOpen)
  } catch (e) {
    ElMessage.error(`${t('batch.errorOpen')}: ${e.message || String(e)}`)
  }
}

async function selectInputDir() {
  if (isProcessing.value) {
    ElMessage.warning(t('batch.warnPause'))
    return
  }
  const selected = await open({
    directory: true,
    multiple: false
  })

  if (selected) {
    inputDir.value = selected
    imageList.value = []
    isScanning.value = true
    displayCount.value = 20
    isPaused.value = false
    isProcessing.value = false
    try {
      await scanDirectory(selected, selected)
    } catch (e) {
      ElMessage.error(`${t('batch.errorScan')}: ${e.message || String(e)}`)
    } finally {
      isScanning.value = false
    }
  }
}

async function selectOutputDir() {
  const selected = await open({
    directory: true,
    multiple: false
  })
  if (selected) {
    outputDir.value = selected
  }
}

const SUPPORTED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'bmp']

async function scanDirectory(dirPath, baseDir) {
  try {
    const entries = await readDir(dirPath)
    for (const entry of entries) {
      const fullPath = await join(dirPath, entry.name)
      if (entry.isDirectory) {
        await scanDirectory(fullPath, baseDir)
      } else {
        const ext = entry.name.split('.').pop().toLowerCase()
        if (SUPPORTED_EXTS.includes(ext)) {
          // 使用 split 确保兼容不同系统的斜杠 (Tauri 在 macOS 上通常是 /)
          let relativePath = fullPath.replace(baseDir, '')
          if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
            relativePath = relativePath.substring(1)
          }
          imageList.value.push({
            name: entry.name,
            fullPath: fullPath,
            relativePath: relativePath,
            status: 'pending', // pending, processing, success, fail
            resultUrl: '',
            thumbnailUrl: convertFileSrc(fullPath),
            error: ''
          })
        }
      }
    }
  } catch (e) {
    console.error('Directory read error:', e)
  }
}

async function startProcessing() {
  if (pendingCount.value === 0) return
  isProcessing.value = true
  isPaused.value = false

  // Determine base output dir
  let baseOutDir = outputDir.value
  if (!baseOutDir) {
    baseOutDir = await join(inputDir.value, 'Apple-Matting-Result')
  }

  // Start limited concurrency loop
  for (let i = 0; i < MAX_CONCURRENT; i++) {
    processNextItem(baseOutDir)
  }
}

function pauseProcessing() {
  isPaused.value = true
  isProcessing.value = false
}

async function processNextItem(baseOutDir) {
  if (isPaused.value) return

  // Find next pending item
  const itemIndex = imageList.value.findIndex(i => i.status === 'pending')
  if (itemIndex === -1) {
    if (activeTasks === 0) {
      isProcessing.value = false
    }
    return
  }

  const item = imageList.value[itemIndex]
  item.status = 'processing'
  activeTasks++

  try {
    // Handle path separators (macOS uses '/')
    const relTokens = item.relativePath.split(/[\\/]/)
    const originalName = relTokens.pop()
    const parentRelDir = relTokens.join('/')

    let targetDir = baseOutDir
    if (parentRelDir) {
      targetDir = await join(baseOutDir, parentRelDir)
    }

    // Ensure dir exists
    if (!(await exists(targetDir))) {
      await mkdir(targetDir, { recursive: true })
    }

    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
    const targetFilename = `${nameWithoutExt}.png` // matting output is PNG inherently with alpha
    const targetPath = await join(targetDir, targetFilename)

    // Call backend API
    const res = await imageMattingAPI({
      inputPath: item.fullPath,
      outputPath: targetPath
    })

    if (res.success && res.output_path) {
      item.status = 'success'
      item.resultUrl = convertFileSrc(res.output_path)
      item.outputPath = res.output_path

      // 为了更好的用户体验，如果有已完成的项目，确保它在我们当前的视野内被加载
      // 但如果一直跳可能会影响体验，所以这里只做简单的计数统计，
      // Vue自动驱动 UI
    } else {
      item.status = 'fail'
      item.error = res.error || 'Unknown error'
    }
  } catch (e) {
    item.status = 'fail'
    item.error = e.message || String(e)
  } finally {
    activeTasks--
    // Continue to next
    if (!isPaused.value) {
      // async 延迟一下避免阻塞 UI
      setTimeout(() => {
        processNextItem(baseOutDir)
      }, 50)
    } else if (activeTasks === 0) {
      isProcessing.value = false
    }
  }
}

onUnmounted(() => {
  isPaused.value = true
})
</script>

<style lang="scss" scoped>
.batch-matting {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  background-color: transparent;
  box-sizing: border-box;
}

.header-section {
  flex-shrink: 0;
}

.info-alert {
  border-radius: 8px;
  background-color: var(--el-color-info-light-9);
}

/* ── 上传区 ───────────────────────────────────────────────── */
.upload-zone {
  width: 100%;
  max-width: 500px;
  margin: 40px auto;
  min-height: 240px;
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

  &:hover {
    border-color: var(--el-color-primary, #409eff);
    background: rgba(64, 158, 255, 0.06);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(64, 158, 255, 0.12);

    html.dark & {
      background: var(--el-color-primary-light-9);
      box-shadow: var(--el-box-shadow-light);
    }
  }

  &__inner {
    text-align: center;
    user-select: none;
  }

  &__icon {
    font-size: 48px;
    color: var(--el-color-primary, #409eff);
    margin-bottom: 12px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  &__hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

/* ── 区块卡片 ──────────────────────────────────────────────── */
.section-card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  padding: 20px;
  flex-shrink: 0;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .panel-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      font-size: 14px;
      font-weight: 500;
      color: #606266;
      width: 80px;
      flex-shrink: 0;
    }

    .path-input {
      flex: 1;
    }
  }

  .panel-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);

    .stats-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .stat-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-width: 60px;
        padding: 6px 16px;
        border-radius: 8px;
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-light);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--el-box-shadow-light);
        }

        .stat-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--el-text-color-primary);
        }
      }

      .stat-total {
        background: var(--el-bg-color);
        border-color: var(--el-border-color);
      }

      .stat-pending {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-8);

        .stat-label,
        .stat-value {
          color: #409eff;
        }
      }

      .stat-success {
        background: var(--el-color-success-light-9);
        border-color: var(--el-color-success-light-8);

        .stat-label,
        .stat-value {
          color: #67c23a;
        }
      }

      .stat-fail {
        background: var(--el-color-danger-light-9);
        border-color: var(--el-color-danger-light-8);

        .stat-label,
        .stat-value {
          color: #f56c6c;
        }
      }

      .stat-progress {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;

        .progress-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--el-text-color-regular);
        }
      }
    }
  }
}

.list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  margin-bottom: 10px;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  border-radius: 12px 12px 0 0;
}

.scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 10px 20px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &:last-child {
    border-bottom: none;
  }
}

.col-img {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  align-items: center;
}

.col-path {
  flex: 1;
  min-width: 0;
  padding: 0 16px;

  .path-text {
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    direction: rtl;
    /* Allows showing the end of long paths */
    text-align: left;
  }
}

.col-status {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  .error-icon {
    color: #f56c6c;
    cursor: pointer;
    font-size: 16px;
  }
}

.thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;

  &.result-thumbnail {
    border-color: #e4e7ed;
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 20px;
  }
}

.checkerboard-bg {
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
  background-color: var(--el-bg-color);
}

.loading-more,
.empty-list {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}
</style>