import { createRouter, createWebHashHistory } from 'vue-router'
import MainView from '../views/MainView.vue'

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
