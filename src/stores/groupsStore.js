import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    groups: []
  }),
  
  getters: {
    getGroups: (state) => state.groups,
  },
  
  actions: {
    async loadGroups() {
      try {
        const data = await chromeStorageGet('onetabs_groups')
        if (data && data.onetabs_groups) {
          this.groups = data.onetabs_groups || []
        }
      } catch (error) {
        console.error('加载组数据失败:', error)
      }
    },
    
    async saveGroups() {
      try {
        await chromeStorageSet('onetabs_groups', this.groups)
      } catch (error) {
        console.error('保存组数据失败:', error)
      }
    },
    
    // 其他原有模块中的方法...
  }
})
