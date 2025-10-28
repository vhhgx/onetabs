import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'

/**
 * Groups Store - 管理永久工作空间
 * 包含标签组(tabGroups)和窗口配置(windows)
 */
export const useGroupsStore = defineStore('groups', {
  state: () => ({
    // 标签组列表
    tabGroups: [],
    // 窗口配置列表
    windows: [],
    // 加载状态
    isLoading: false,
    // 最后保存时间
    lastSaved: null,
  }),

  getters: {
    // 获取所有标签组
    getTabGroups: (state) => state.tabGroups,

    // 获取所有窗口配置
    getWindows: (state) => state.windows,

    // 根据ID获取标签组
    getTabGroupById: (state) => (id) => {
      return state.tabGroups.find(group => group.id === id)
    },

    // 根据ID获取窗口配置
    getWindowById: (state) => (id) => {
      return state.windows.find(window => window.id === id)
    },

    // 获取标签组的引用计数（被多少个窗口使用）
    getTabGroupRefCount: (state) => (groupId) => {
      return state.windows.filter(window =>
        window.tabGroupIds.includes(groupId)
      ).length
    }
  },

  actions: {
    /**
     * 从存储加载数据
     */
    async loadGroups() {
      this.isLoading = true
      try {
        const data = await chromeStorageGet('onetabs_groups')
        if (data && data.onetabs_groups) {
          this.tabGroups = data.onetabs_groups.tabGroups || []
          this.windows = data.onetabs_groups.windows || []
        }
      } catch (error) {
        console.error('加载Groups数据失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 保存数据到存储
     */
    async saveGroups() {
      try {
        await chromeStorageSet('onetabs_groups', {
          tabGroups: this.tabGroups,
          windows: this.windows
        })
        this.lastSaved = new Date().toISOString()
      } catch (error) {
        console.error('保存Groups数据失败:', error)
        throw error
      }
    },

    /**
     * 创建新标签组
     * @param {string} name - 标签组名称
     * @param {string} color - 标签组颜色
     * @param {Array} tabs - 标签列表
     */
    async createTabGroup(name, color = '#3B82F6', tabs = []) {
      const newGroup = {
        id: `group-${Date.now()}`,
        name,
        color,
        tabs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.tabGroups.push(newGroup)
      await this.saveGroups()
      return newGroup
    },

    /**
     * 更新标签组
     * @param {string} id - 标签组ID
     * @param {Object} updates - 更新的字段
     */
    async updateTabGroup(id, updates) {
      const index = this.tabGroups.findIndex(group => group.id === id)
      if (index === -1) {
        throw new Error(`标签组不存在: ${id}`)
      }

      this.tabGroups[index] = {
        ...this.tabGroups[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await this.saveGroups()
      return this.tabGroups[index]
    },

    /**
     * 删除标签组
     * @param {string} id - 标签组ID
     */
    async deleteTabGroup(id) {
      // 检查是否被窗口引用
      const refCount = this.getTabGroupRefCount(id)
      if (refCount > 0) {
        throw new Error(`标签组正在被 ${refCount} 个窗口使用，无法删除`)
      }

      this.tabGroups = this.tabGroups.filter(group => group.id !== id)
      await this.saveGroups()
    },

    /**
     * 添加标签到标签组
     * @param {string} groupId - 标签组ID
     * @param {Object} tab - 标签对象
     */
    async addTabToGroup(groupId, tab) {
      const group = this.getTabGroupById(groupId)
      if (!group) {
        throw new Error(`标签组不存在: ${groupId}`)
      }

      group.tabs.push({
        id: `tab-${Date.now()}`,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        addedAt: new Date().toISOString()
      })

      await this.updateTabGroup(groupId, { tabs: group.tabs })
    },

    /**
     * 从标签组移除标签
     * @param {string} groupId - 标签组ID
     * @param {string} tabId - 标签ID
     */
    async removeTabFromGroup(groupId, tabId) {
      const group = this.getTabGroupById(groupId)
      if (!group) {
        throw new Error(`标签组不存在: ${groupId}`)
      }

      const updatedTabs = group.tabs.filter(tab => tab.id !== tabId)
      await this.updateTabGroup(groupId, { tabs: updatedTabs })
    },

    /**
     * 创建窗口配置
     * @param {string} name - 窗口名称
     * @param {Array} tabGroupIds - 标签组ID列表
     * @param {Array} standaloneTabs - 独立标签列表
     */
    async createWindow(name, tabGroupIds = [], standaloneTabs = []) {
      const newWindow = {
        id: `window-${Date.now()}`,
        name,
        tabGroupIds,
        standaloneTabs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.windows.push(newWindow)
      await this.saveGroups()
      return newWindow
    },

    /**
     * 更新窗口配置
     * @param {string} id - 窗口ID
     * @param {Object} updates - 更新的字段
     */
    async updateWindow(id, updates) {
      const index = this.windows.findIndex(window => window.id === id)
      if (index === -1) {
        throw new Error(`窗口配置不存在: ${id}`)
      }

      this.windows[index] = {
        ...this.windows[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await this.saveGroups()
      return this.windows[index]
    },

    /**
     * 删除窗口配置
     * @param {string} id - 窗口ID
     */
    async deleteWindow(id) {
      this.windows = this.windows.filter(window => window.id !== id)
      await this.saveGroups()
    },

    /**
     * 打开窗口配置
     * @param {string} windowId - 窗口ID
     * @returns {Promise<number>} 新窗口的ID
     */
    async openWindow(windowId) {
      const windowConfig = this.getWindowById(windowId)
      if (!windowConfig) {
        throw new Error(`窗口配置不存在: ${windowId}`)
      }

      if (!chrome.windows) {
        throw new Error('Chrome API不可用')
      }

      // 收集所有需要打开的标签
      const tabsToOpen = []

      // 添加标签组中的标签
      for (const groupId of windowConfig.tabGroupIds) {
        const group = this.getTabGroupById(groupId)
        if (group) {
          // 先关闭其他窗口中已打开的相同标签组
          await this.closeTabGroupInOtherWindows(groupId)

          tabsToOpen.push(...group.tabs.map(tab => ({
            url: tab.url,
            groupId: groupId,
            groupColor: group.color,
            groupName: group.name
          })))
        }
      }

      // 添加独立标签
      tabsToOpen.push(...windowConfig.standaloneTabs.map(tab => ({
        url: tab.url
      })))

      // 创建新窗口
      const newWindow = await chrome.windows.create({
        focused: true,
        url: tabsToOpen.length > 0 ? tabsToOpen[0].url : 'chrome://newtab'
      })

      // 创建剩余标签
      const createdTabs = [newWindow.tabs[0]]
      for (let i = 1; i < tabsToOpen.length; i++) {
        const tab = await chrome.tabs.create({
          windowId: newWindow.id,
          url: tabsToOpen[i].url,
          active: false
        })
        createdTabs.push(tab)
      }

      // 创建标签组
      if (chrome.tabGroups) {
        const groupMap = new Map() // groupId -> chrome group id

        for (let i = 0; i < tabsToOpen.length; i++) {
          const tabConfig = tabsToOpen[i]
          if (tabConfig.groupId) {
            if (!groupMap.has(tabConfig.groupId)) {
              // 创建新的Chrome标签组
              const groupId = await chrome.tabs.group({
                tabIds: createdTabs[i].id
              })

              await chrome.tabGroups.update(groupId, {
                title: tabConfig.groupName,
                color: this.convertColorToChrome(tabConfig.groupColor)
              })

              groupMap.set(tabConfig.groupId, groupId)
            } else {
              // 添加到已存在的标签组
              await chrome.tabs.group({
                tabIds: createdTabs[i].id,
                groupId: groupMap.get(tabConfig.groupId)
              })
            }
          }
        }
      }

      return newWindow.id
    },

    /**
     * 关闭其他窗口中的标签组
     * @param {string} groupId - 标签组ID
     */
    async closeTabGroupInOtherWindows(groupId) {
      if (!chrome.tabs || !chrome.tabGroups) return

      try {
        // 获取所有标签
        const allTabs = await chrome.tabs.query({})

        // 找到属于该标签组的标签（通过URL匹配）
        const group = this.getTabGroupById(groupId)
        if (!group) return

        const groupUrls = new Set(group.tabs.map(tab => tab.url))
        const tabsToClose = allTabs.filter(tab => groupUrls.has(tab.url))

        if (tabsToClose.length > 0) {
          await chrome.tabs.remove(tabsToClose.map(tab => tab.id))
        }
      } catch (error) {
        console.error('关闭标签组失败:', error)
      }
    },

    /**
     * 将十六进制颜色转换为Chrome标签组颜色
     * @param {string} hexColor - 十六进制颜色
     * @returns {string} Chrome颜色名称
     */
    convertColorToChrome(hexColor) {
      const colorMap = {
        '#3B82F6': 'blue',
        '#EF4444': 'red',
        '#10B981': 'green',
        '#F59E0B': 'orange',
        '#8B5CF6': 'purple',
        '#EC4899': 'pink',
        '#06B6D4': 'cyan',
        '#6366F1': 'blue'
      }
      return colorMap[hexColor] || 'grey'
    }
  }
})
