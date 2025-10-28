import { createRouter, createWebHashHistory } from 'vue-router'
import TabGroups from '../views/TabGroups.vue'
import Groups from '../views/Groups.vue'

const routes = [
  {
    path: '/',
    name: 'TabGroups',
    component: TabGroups,
    // 添加元数据帮助页面识别
    meta: {
      title: '标签列表',
      keepAlive: true, // 启用组件缓存
    },
  },
  {
    path: '/groups',
    name: 'Groups',
    component: Groups,
    meta: {
      title: '标签组工作空间',
      keepAlive: true
    }
  },
  // {
  //   path: '/settings',
  //   name: 'settings',
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ '../views/Settings.vue'),
  //   meta: {
  //     title: '设置',
  //     keepAlive: false,
  //   },
  // },
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
