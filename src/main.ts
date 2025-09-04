import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 移动端适配
import 'vant/lib/index.css'

// PC端样式
import 'element-plus/dist/index.css'

// 全局样式
import './styles/index.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')