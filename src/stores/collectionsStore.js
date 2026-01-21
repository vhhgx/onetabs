import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'
import { errorHandler } from '../utils/errorHandler'

/**
 * Collections Store - 管理标签页组（收藏集）
 * 标签页组是用户手动创建的标签页集合，用于组织和管理常用网站
 */
export const useCollectionsStore = defineStore('collections', {
  state: () => ({
    // 所有标签页组
    collections: [],
    // 当前编辑的标签页组
    currentCollection: null,
    // 加载状态
    isLoading: false,
    // 最后加载时间
    lastLoaded: null,
  }),

  getters: {
    /**
     * 获取所有标签页组
     */
    getCollections: (state) => state.collections,

    /**
     * 获取置顶的标签页组
     */
    getPinnedCollections: (state) => state.collections.filter((c) => c.pinned),

    /**
     * 获取非置顶的标签页组
     */
    getUnpinnedCollections: (state) => state.collections.filter((c) => !c.pinned),

    /**
     * 根据ID获取标签页组
     */
    getCollectionById: (state) => (id) => {
      return state.collections.find((c) => c.id === id)
    },

    /**
     * 获取标签页组总数
     */
    getTotalCount: (state) => state.collections.length,

    /**
     * 获取所有标签页总数
     */
    getTotalTabsCount: (state) => {
      return state.collections.reduce((total, collection) => {
        return total + (collection.tabs?.length || 0)
      }, 0)
    },
  },

  actions: {
    /**
     * 将对象格式的数据转换为数组格式
     * Chrome Storage 有时会将数组保存为对象格式
     */
    normalizeData(data) {
      if (Array.isArray(data)) {
        // 已经是数组，递归处理每个元素
        return data.map(item => this.normalizeData(item))
      }
      
      if (data && typeof data === 'object') {
        // 检查是否是类数组对象（键为 "0", "1", "2" 等）
        const keys = Object.keys(data)
        const isArrayLike = keys.length > 0 && keys.every(key => /^\d+$/.test(key))
        
        if (isArrayLike) {
          // 转换为数组
          const arr = []
          for (let i = 0; i < keys.length; i++) {
            if (data[i] !== undefined) {
              arr.push(this.normalizeData(data[i]))
            }
          }
          return arr
        }
        
        // 普通对象，递归处理每个属性
        const normalized = {}
        for (const key in data) {
          normalized[key] = this.normalizeData(data[key])
        }
        return normalized
      }
      
      // 基本类型，直接返回
      return data
    },

    /**
     * 从 Storage 加载所有标签页组
     */
    async loadCollections() {
      this.isLoading = true
      try {
        const data = await chromeStorageGet('onetabs_collections')
        console.log('加载的标签页组原始数据:', data)
        
        let collectionsList = []
        if (data && data.onetabs_collections) {
          const normalized = this.normalizeData(data.onetabs_collections)
          console.log('规范化后的数据:', normalized)
          
          if (Array.isArray(normalized)) {
            collectionsList = normalized
          }
        } else if (data) {
          const normalized = this.normalizeData(data)
          if (Array.isArray(normalized)) {
            collectionsList = normalized
          }
        }
        
        this.collections = collectionsList
        console.log('加载的标签页组数量:', this.collections.length)
        this.lastLoaded = new Date().toISOString()
      } catch (error) {
        errorHandler.handleStorageError(error, '加载收藏集失败')
        this.collections = []
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 保存标签页组到 Storage
     */
    async saveCollections() {
      try {
        console.log('保存标签页组数量:', this.collections.length)
        await chromeStorageSet('onetabs_collections', this.collections)
        console.log('标签页组保存成功')
      } catch (error) {
        errorHandler.handleStorageError(error, '保存收藏集失败')
        throw error
      }
    },

    /**
     * 创建新标签页组
     * @param {Object} data - 标签页组数据
     */
    async createCollection(data) {
      try {
        const newCollection = {
          id: `collection_${Date.now()}`,
          name: data.name || '未命名标签页组',
          color: data.color || 'blue',
          icon: data.icon || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pinned: data.pinned || false,
          tabs: data.tabs || [],
        }
        
        console.log('创建新标签页组:', newCollection)
        this.collections.unshift(newCollection)
        await this.saveCollections()
        
        return newCollection
      } catch (error) {
        errorHandler.handleError(error, '创建收藏集失败')
        throw error
      }
    },

    /**
     * 更新标签页组
     * @param {string} id - 标签页组ID
     * @param {Object} data - 更新的数据
     */
    async updateCollection(id, data) {
      try {
        const collection = this.collections.find((c) => c.id === id)
        if (!collection) {
          throw new Error('标签页组不存在')
        }
        
        // 更新数据
        if (data.name !== undefined) collection.name = data.name
        if (data.color !== undefined) collection.color = data.color
        if (data.icon !== undefined) collection.icon = data.icon
        if (data.pinned !== undefined) collection.pinned = data.pinned
        if (data.tabs !== undefined) collection.tabs = data.tabs
        
        collection.updatedAt = Date.now()
        
        await this.saveCollections()
        console.log('标签页组更新成功:', id)
        
        return collection
      } catch (error) {
        errorHandler.handleError(error, '更新收藏集失败')
        throw error
      }
    },

    /**
     * 删除标签页组
     * @param {string} id - 标签页组ID
     */
    async deleteCollection(id) {
      try {
        const index = this.collections.findIndex((c) => c.id === id)
        if (index === -1) {
          throw new Error('标签页组不存在')
        }
        
        this.collections.splice(index, 1)
        await this.saveCollections()
        console.log('标签页组删除成功:', id)
        
        return true
      } catch (error) {
        errorHandler.handleError(error, '删除收藏集失败')
        throw error
      }
    },

    /**
     * 添加标签页到标签页组
     * @param {string} collectionId - 标签页组ID
     * @param {Object} tabData - 标签页数据
     */
    async addTab(collectionId, tabData) {
      try {
        const collection = this.collections.find((c) => c.id === collectionId)
        if (!collection) {
          throw new Error('标签页组不存在')
        }
        
        const newTab = {
          title: tabData.title || '未命名标签页',
          url: tabData.url,
          favIconUrl: tabData.favIconUrl || '',
          order: collection.tabs.length,
        }
        
        collection.tabs.push(newTab)
        collection.updatedAt = Date.now()
        
        await this.saveCollections()
        console.log('标签页添加成功')
        
        return newTab
      } catch (error) {
        console.error('添加标签页失败:', error)
        throw error
      }
    },

    /**
     * 从标签页组移除标签页
     * @param {string} collectionId - 标签页组ID
     * @param {number} tabIndex - 标签页索引
     */
    async removeTab(collectionId, tabIndex) {
      try {
        const collection = this.collections.find((c) => c.id === collectionId)
        if (!collection) {
          throw new Error('标签页组不存在')
        }
        
        if (tabIndex < 0 || tabIndex >= collection.tabs.length) {
          throw new Error('标签页索引无效')
        }
        
        collection.tabs.splice(tabIndex, 1)
        collection.updatedAt = Date.now()
        
        // 重新计算 order
        collection.tabs.forEach((tab, index) => {
          tab.order = index
        })
        
        await this.saveCollections()
        console.log('标签页移除成功')
        
        return true
      } catch (error) {
        console.error('移除标签页失败:', error)
        throw error
      }
    },

    /**
     * 重新排序标签页
     * @param {string} collectionId - 标签页组ID
     * @param {Array} newOrder - 新的标签页数组
     */
    async reorderTabs(collectionId, newOrder) {
      try {
        const collection = this.collections.find((c) => c.id === collectionId)
        if (!collection) {
          throw new Error('标签页组不存在')
        }
        
        collection.tabs = newOrder.map((tab, index) => ({
          ...tab,
          order: index,
        }))
        collection.updatedAt = Date.now()
        
        await this.saveCollections()
        console.log('标签页重新排序成功')
        
        return true
      } catch (error) {
        console.error('重新排序标签页失败:', error)
        throw error
      }
    },

    /**
     * 重新排序标签页组
     * @param {Array} newOrder - 新的标签页组数组
     */
    async reorderCollections(newOrder) {
      try {
        this.collections = newOrder
        await this.saveCollections()
        console.log('标签页组重新排序成功')
        
        return true
      } catch (error) {
        console.error('重新排序标签页组失败:', error)
        throw error
      }
    },

    /**
     * 打开标签页组
     * @param {string} id - 标签页组ID
     * @param {Object} options - 打开选项
     */
    async openCollection(id, options = {}) {
      try {
        const collection = this.collections.find((c) => c.id === id)
        if (!collection) {
          throw new Error('标签页组不存在')
        }
        
        const {
          inNewWindow = false,
          createTabGroup = true,
          inBackground = false,
        } = options
        
        console.log('打开标签页组:', collection.name, options)
        
        if (inNewWindow) {
          // 在新窗口打开
          const window = await chrome.windows.create({ focused: !inBackground })
          const windowId = window.id
          
          // 移除默认的新标签页
          const tabs = await chrome.tabs.query({ windowId })
          if (tabs.length > 0) {
            await chrome.tabs.remove(tabs[0].id)
          }
          
          // 创建所有标签页
          const createdTabs = []
          for (const tab of collection.tabs) {
            const createdTab = await chrome.tabs.create({
              windowId,
              url: tab.url,
              active: false,
            })
            createdTabs.push(createdTab)
          }
          
          // 如果需要创建 Tab Group
          if (createTabGroup && createdTabs.length > 0) {
            const tabIds = createdTabs.map((t) => t.id)
            const groupId = await chrome.tabs.group({ tabIds })
            await chrome.tabGroups.update(groupId, {
              title: collection.name,
              color: collection.color,
            })
          }
          
          // 激活第一个标签页
          if (createdTabs.length > 0 && !inBackground) {
            await chrome.tabs.update(createdTabs[0].id, { active: true })
          }
        } else {
          // 在当前窗口打开
          const createdTabs = []
          for (const tab of collection.tabs) {
            const createdTab = await chrome.tabs.create({
              url: tab.url,
              active: false,
            })
            createdTabs.push(createdTab)
          }
          
          // 如果需要创建 Tab Group
          if (createTabGroup && createdTabs.length > 0) {
            const tabIds = createdTabs.map((t) => t.id)
            const groupId = await chrome.tabs.group({ tabIds })
            await chrome.tabGroups.update(groupId, {
              title: collection.name,
              color: collection.color,
            })
          }
          
          // 激活第一个标签页
          if (createdTabs.length > 0 && !inBackground) {
            await chrome.tabs.update(createdTabs[0].id, { active: true })
          }
        }
        
        console.log('标签页组打开成功')
        return true
      } catch (error) {
        console.error('打开标签页组失败:', error)
        throw error
      }
    },

    /**
     * 切换标签页组置顶状态
     * @param {string} id - 标签页组ID
     */
    async togglePin(id) {
      try {
        const collection = this.collections.find((c) => c.id === id)
        if (!collection) {
          throw new Error('标签页组不存在')
        }
        
        collection.pinned = !collection.pinned
        collection.updatedAt = Date.now()
        
        // 重新排序：置顶的在前
        this.collections.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1
          return b.createdAt - a.createdAt
        })
        
        await this.saveCollections()
        console.log('标签页组置顶状态切换成功')
        
        return collection.pinned
      } catch (error) {
        console.error('切换置顶失败:', error)
        throw error
      }
    },

    /**
     * 清空所有标签页组
     */
    async clearAllCollections() {
      try {
        this.collections = []
        await this.saveCollections()
        console.log('所有标签页组已清空')
        
        return true
      } catch (error) {
        console.error('清空标签页组失败:', error)
        throw error
      }
    },
  },
})
