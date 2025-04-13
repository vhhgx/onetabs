import { createRouter, createWebHashHistory } from 'vue-router'
import TabGroups from '../views/TabGroups.vue'

const routes = [
  {
    path: '/',
    name: 'Group',
    component: TabGroups,
    // 添加元数据帮助页面识别
    meta: {
      title: '标签管理',
      keepAlive: true, // 启用组件缓存
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/Settings.vue'),
    meta: {
      title: '设置',
      keepAlive: false,
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
