<template>
    <div class="header-container">
        <div class="logo-section">
            <img src="/logo.png" alt="Logo" class="logo" />
            <div class="title-section">
                <h1 class="main-title">{{ $t('header.title') }}</h1>
                <span class="sub-title">{{ $t('header.subTitle') }}</span>
            </div>
        </div>

        <div class="actions-section">
            <!-- 灵象工具箱 -->
            <a href="https://www.lingxiangtools.top/?utm_source=apple_matting&utm_medium=desktop&utm_campaign=header_link"
               target="_blank"
               data-umami-event="click-lingxiang-tools"
               data-umami-event-source="header"
               class="action-btn"
               style="text-decoration: none; font-size: 14px; display: flex; align-items: center; height: 32px; padding: 0 8px;">
                {{ $t('header.lingxiangTools') }}
            </a>

            <el-dropdown trigger="click" @command="handleSetLanguage">
                <span class="el-dropdown-link action-btn"
                    style="cursor: pointer; display: flex; align-items: center; justify-content: center; height: 32px; padding: 0 8px;">
                    {{ currentLangLabel }}
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="zh" :disabled="locale === 'zh'">中文</el-dropdown-item>
                        <el-dropdown-item command="en" :disabled="locale === 'en'">English</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <el-dropdown trigger="click" @command="handleSetTheme">
                <span class="el-dropdown-link action-btn"
                    style="cursor: pointer; display: flex; align-items: center; justify-content: center; height: 32px; padding: 0 8px;">
                    <el-icon :size="20">
                        <component :is="themeIcon" />
                    </el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="light" :disabled="themeMode === 'light'">
                            <el-icon>
                                <Sunny />
                            </el-icon>{{ $t('header.theme.light') }}
                        </el-dropdown-item>
                        <el-dropdown-item command="dark" :disabled="themeMode === 'dark'">
                            <el-icon>
                                <Moon />
                            </el-icon>{{ $t('header.theme.dark') }}
                        </el-dropdown-item>
                        <el-dropdown-item command="auto" :disabled="themeMode === 'auto'">
                            <el-icon>
                                <Monitor />
                            </el-icon>{{ $t('header.theme.auto') }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
            <el-button link class="action-btn" @click="showAboutDialog = true">
                <el-icon :size="20">
                    <InfoFilled />
                </el-icon>
            </el-button>
        </div>

        <AboutDialog v-model="showAboutDialog" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useColorMode } from '@vueuse/core'
import { Sunny, Moon, Monitor, InfoFilled } from '@element-plus/icons-vue'
import AboutDialog from './AboutDialog.vue'

const { locale } = useI18n()

const showAboutDialog = ref(false)

const currentLangLabel = computed(() => {
    return locale.value === 'zh' ? '中' : 'EN'
})

const handleSetLanguage = (lang) => {
    locale.value = lang
    localStorage.setItem('apple-matting-lang', lang)
}

// Theme handling
const themeMode = useColorMode({
    emitAuto: true,
    attribute: 'class',
    modes: {
        dark: 'dark',
        light: 'light',
    }
})

const themeIcon = computed(() => {
    if (themeMode.value === 'dark') return Moon
    if (themeMode.value === 'light') return Sunny
    return Monitor
})

const handleSetTheme = (mode) => {
    themeMode.value = mode
}
</script>

<style scoped lang="scss">
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 20px;
    background-color: var(--layout-bg);
    box-shadow: var(--layout-shadow);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--layout-border);
}

.logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo {
    height: 36px;
    width: auto;
    border-radius: 6px;
}

.title-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.main-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;
}

.sub-title {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.actions-section {
    display: flex;
    align-items: center;
    gap: 16px;
}

.action-btn {
    color: var(--el-text-color-regular);

    &:hover {
        color: var(--el-color-primary);
    }
}
</style>
