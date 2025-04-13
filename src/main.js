import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

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
app.mount('#app')
