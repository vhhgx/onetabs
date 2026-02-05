import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'
import { extractDomain } from '../utils/faviconCache'

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [],
    tabGroups: [],
    isLoading: false,
    lastSaved: null,
  }),

  getters: {
    getTabs: (state) => state.tabs,
    getTabGroups: (state) => state.tabGroups,
    hasTabs: (state) => state.tabs.length > 0,
    sortedTabs: (state) => [...state.tabs].sort((a, b) => a.title.localeCompare(b.title)),
  },

  actions: {
    async loadTabs() {
      try {
        // 从 Chrome 存储中获取数据
        const data = await chromeStorageGet('onetabs_data')
        if (data && data.onetabs_data) {
          this.tabs = data.onetabs_data.tabs || []
          this.tabGroups = data.onetabs_data.tabGroups || []
        }
      } catch (error) {
        console.error('加载标签数据失败:', error)
      }
    },

    async saveTabs() {
      try {
        // 保存数据到 Chrome 存储
        await chromeStorageSet('onetabs_data', {
          tabs: this.tabs,
          tabGroups: this.tabGroups,
        })
        this.lastSaved = new Date().toISOString()
      } catch (error) {
        console.error('保存标签数据失败:', error)
      }
    },

    async getCurrentTabs() {
      if (chrome.tabs) {
        try {
          const tabs = await chrome.tabs.query({ currentWindow: true })
          // 处理获取到的标签
          const simplifiedTabs = tabs.map((tab) => ({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            domain: extractDomain(tab.url),
          }))

          this.tabs = [...this.tabs, ...simplifiedTabs]
          // 保存新增的标签
          await this.saveTabs()
          return simplifiedTabs
        } catch (error) {
          console.error('获取当前标签失败:', error)
          return []
        }
      }
      return []
    },

    async createTabGroup(name, tabIds = []) {
      const newGroup = {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString(),
        tabs: tabIds.length ? tabIds : this.tabs.map((tab) => tab.id),
      }

      this.tabGroups.push(newGroup)
      await this.saveTabs()
      return newGroup
    },

    removeTab(tabId) {
      this.tabs = this.tabs.filter((tab) => tab.id !== tabId)
      this.saveTabs()
    },

    clearAllTabs() {
      this.tabs = []
      this.saveTabs()
    },
  },
})
