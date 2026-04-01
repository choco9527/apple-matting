import { createI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// 导入自定义的多语言文件
import zhLocale from './zh'
import enLocale from './en'

// 合并 Element Plus 的语言包和项目的语言包
const messages = {
    zh: {
        ...zhCn,
        ...zhLocale
    },
    en: {
        ...en,
        ...enLocale
    }
}

// 获取系统默认语言
const getSystemLanguage = () => {
    const lang = navigator.language || navigator.userLanguage || 'zh'
    return lang.toLowerCase().startsWith('en') ? 'en' : 'zh'
}

// 获取当前语言 (优先从 localStorage 获取，如果没有则使用系统语言)
const getLanguage = () => {
    const localLang = localStorage.getItem('apple-matting-lang')
    return localLang || getSystemLanguage()
}

// 创建 i18n 实例
const i18n = createI18n({
    legacy: false, // 使用 Composition API 模式
    locale: getLanguage(), // 默认语言
    fallbackLocale: 'en', // 回退语言
    messages, // 多语言包
    globalInjection: true, // 全局注入 $t
})

export default i18n
