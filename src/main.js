import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/style/index.css'
import './assets/style/animations.css'
import './assets/style/theme.css'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'

import Tooltip from 'primevue/tooltip'

const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue错误:', err)
  console.log('组件:', vm?.$options?.name || '未知组件')
  console.log('错误信息:', info)
}

// 全局路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

// 安装路由
app.use(router)

// 安装pinia
app.use(createPinia())

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      // prefix: 'p',
      darkModeSelector: false,
    },
  },
})

// 注册 Toast 和 Confirmation 服务
app.use(ToastService)
app.use(ConfirmationService)

app.directive('tooltip', Tooltip)

app.mount('#app')

// 注册 Service Worker（用于缓存 favicon）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker 注册成功:', registration.scope)
        
        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('[App] Service Worker 更新中...')
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[App] Service Worker 已更新')
            }
          })
        })
      })
      .catch((error) => {
        console.log('[App] Service Worker 注册失败:', error)
      })
  })
}
