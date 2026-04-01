<template>
    <el-dialog v-model="dialogVisible" :title="$t('about.title')" width="500px" align-center append-to-body>
        <div class="about-content">
            <!-- Check Update -->
            <div class="info-card clickable" @click="checkUpdate">
                <div class="info-left">
                    <el-icon :size="20" class="info-icon">
                        <Refresh />
                    </el-icon>
                    <span class="info-label">{{ $t('about.checkUpdate') }}</span>
                </div>
                <el-icon :size="18" class="arrow-icon">
                    <TopRight />
                </el-icon>
            </div>

            <!-- Version -->
            <div class="info-card">
                <div class="info-left">
                    <el-icon :size="20" class="info-icon">
                        <InfoFilled />
                    </el-icon>
                    <span class="info-label">{{ $t('about.version') }}</span>
                </div>
                <span class="info-value">v0.1.1</span>
            </div>

            <!-- Author -->
            <div class="info-card">
                <div class="info-left">
                    <el-icon :size="20" class="info-icon">
                        <User />
                    </el-icon>
                    <span class="info-label">{{ $t('about.author') }}</span>
                </div>
                <span class="info-value">XIAOBIN</span>
            </div>

            <!-- Email -->
            <div class="info-card">
                <div class="info-left">
                    <el-icon :size="20" class="info-icon">
                        <Message />
                    </el-icon>
                    <span class="info-label">{{ $t('about.email') }}</span>
                </div>
                <span class="info-value">lxt@lingxiangtools.top</span>
            </div>

            <!-- Website -->
            <div class="info-card clickable" @click="openWebsite">
                <div class="info-left">
                    <el-icon :size="20" class="info-icon">
                        <Link />
                    </el-icon>
                    <span class="info-label">{{ $t('about.website') }}</span>
                </div>
                <div class="info-right">
                    <span class="info-value link-value">matting.lingxiangtools.top</span>
                    <el-icon :size="18" class="arrow-icon">
                        <TopRight />
                    </el-icon>
                </div>
            </div>

            <!-- Copyright -->
            <div class="copyright">
                {{ $t('about.copyright') }}
            </div>

            <!-- QR Codes -->
            <div class="qr-section">
                <div class="qr-card">
                    <div class="qr-placeholder">
                        <img src="/wx_sponsor.webp" alt="赞助二维码" class="qr-image" />
                    </div>
                    <span class="qr-label">{{ $t('about.sponsor') }}</span>
                </div>

                <div class="qr-card">
                    <div class="qr-placeholder">
                        <img src="/wx.webp" alt="公众号二维码" class="qr-image" />
                    </div>
                    <span class="qr-label">{{ $t('about.wechat') }}</span>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Picture, InfoFilled, User, Message, Link, TopRight, Refresh } from '@element-plus/icons-vue'
import { openUrl } from '@tauri-apps/plugin-opener'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const checkUpdate = async () => {
    await openUrl('https://matting.lingxiangtools.top/version')
}

const openWebsite = async () => {
    await openUrl('https://matting.lingxiangtools.top')
}
</script>

<style scoped lang="scss">
.about-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
}

.info-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px 20px;
    transition: all 0.2s;
    border: 1px solid var(--el-border-color-lighter);

    &.clickable {
        cursor: pointer;

        &:hover {
            background-color: var(--el-fill-color);
            border-color: var(--el-border-color);

            .link-value {
                color: var(--el-color-primary);
            }

            .arrow-icon {
                transform: translate(2px, -2px);
                color: var(--el-color-primary);
            }
        }
    }
}

.info-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .info-icon {
        color: var(--el-text-color-secondary);
        flex-shrink: 0;
    }

    .info-label {
        font-size: 15px;
        color: var(--el-text-color-primary);
    }
}

.info-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.info-value {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    word-break: break-all;

    &.link-value {
        transition: color 0.2s;
    }
}

.arrow-icon {
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
    transition: all 0.2s;
}

.copyright {
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    padding: 16px 0;
    margin: 8px 0;
    border-top: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.qr-section {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 8px;
}

.qr-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .qr-placeholder {
        width: 140px;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--el-fill-color-lighter);
        border-radius: 8px;
        border: 1px dashed var(--el-border-color);
        overflow: hidden;

        .qr-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .qr-label {
        font-size: 14px;
        color: var(--el-text-color-primary);
        font-weight: 500;
    }
}
</style>
