import { createRouter, createWebHashHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import Settings from '../views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Main',
    component: MainView,
    meta: {
      title: 'OneTabs',
      keepAlive: true,
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: 'OneTabs - 设置',
    },
  },
  // 重定向所有未知路径
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
