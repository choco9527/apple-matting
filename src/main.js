import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/style.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css'

import i18n from './locales'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(router)
app.use(i18n)
app.mount('#app')
