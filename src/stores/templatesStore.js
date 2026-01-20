// stores/templatesStore.js
import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '@/utils/chrome-storage'
import { useCollectionsStore } from './collectionsStore'

const STORAGE_KEY = 'onetabs_templates'

export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    templates: [],
    currentTemplate: null,
    isLoading: false
  }),

  getters: {
    getTemplates: (state) => state.templates,
    getTemplateById: (state) => (id) => state.templates.find(t => t.id === id),
    getTotalCount: (state) => state.templates.length,
    getRecentTemplates: (state) => {
      return [...state.templates]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
    }
  },

  actions: {
    /**
     * 从存储加载所有模板
     */
    async loadTemplates() {
      this.isLoading = true
      try {
        console.log('开始加载窗口模板...')
        const result = await chromeStorageGet(STORAGE_KEY)
        this.templates = result[STORAGE_KEY] || []
        console.log('窗口模板加载完成，数量:', this.templates.length)
        return this.templates
      } catch (error) {
        console.error('加载窗口模板失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 保存模板到存储
     */
    async saveToStorage() {
      try {
        await chromeStorageSet({ [STORAGE_KEY]: this.templates })
        console.log('窗口模板已保存到存储')
      } catch (error) {
        console.error('保存窗口模板失败:', error)
        throw error
      }
    },

    /**
     * 创建新模板
     */
    async createTemplate(data) {
      try {
        const template = {
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          description: data.description || '',
          icon: data.icon || '📋',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          collections: data.collections || [],
          standaloneTabs: data.standaloneTabs || []
        }

        console.log('创建窗口模板:', template.name)
        this.templates.push(template)
        await this.saveToStorage()
        return template
      } catch (error) {
        console.error('创建窗口模板失败:', error)
        throw error
      }
    },

    /**
     * 从当前窗口创建模板
     */
    async createFromCurrentWindow(name, description = '') {
      try {
        if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabGroups) {
          throw new Error('此功能需要在 Chrome 扩展环境中运行')
        }

        console.log('从当前窗口创建模板...')

        // 获取当前窗口的所有标签页
        const tabs = await chrome.tabs.query({ currentWindow: true })
        console.log('当前窗口标签页数量:', tabs.length)

        // 获取当前窗口的所有标签组
        const groups = await chrome.tabGroups.query({ windowId: tabs[0].windowId })
        console.log('当前窗口标签组数量:', groups.length)

        const collections = []
        const standaloneTabs = []

        // 按标签组组织标签页
        for (const group of groups) {
          const groupTabs = tabs.filter(tab => tab.groupId === group.id)
          if (groupTabs.length > 0) {
            collections.push({
              collectionId: null, // 不引用现有 collection
              name: group.title || '未命名组',
              color: group.color || 'grey',
              createGroup: true,
              isReference: false, // 快照模式
              tabs: groupTabs.map(tab => ({
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl,
                pinned: tab.pinned,
                order: tab.index
              }))
            })
          }
        }

        // 收集未分组的标签页
        const ungroupedTabs = tabs.filter(tab => tab.groupId === -1)
        for (const tab of ungroupedTabs) {
          // 跳过 chrome:// 协议的页面
          if (tab.url.startsWith('chrome://')) continue
          
          standaloneTabs.push({
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            pinned: tab.pinned
          })
        }

        console.log('解析结果 - 组:', collections.length, '独立标签页:', standaloneTabs.length)

        return await this.createTemplate({
          name,
          description,
          collections,
          standaloneTabs
        })
      } catch (error) {
        console.error('从当前窗口创建模板失败:', error)
        throw error
      }
    },

    /**
     * 更新模板
     */
    async updateTemplate(id, data) {
      try {
        const index = this.templates.findIndex(t => t.id === id)
        if (index === -1) {
          throw new Error('模板不存在')
        }

        console.log('更新窗口模板:', id)
        this.templates[index] = {
          ...this.templates[index],
          ...data,
          updatedAt: Date.now()
        }

        await this.saveToStorage()
        return this.templates[index]
      } catch (error) {
        console.error('更新窗口模板失败:', error)
        throw error
      }
    },

    /**
     * 删除模板
     */
    async deleteTemplate(id) {
      try {
        const index = this.templates.findIndex(t => t.id === id)
        if (index === -1) {
          throw new Error('模板不存在')
        }

        console.log('删除窗口模板:', id)
        this.templates.splice(index, 1)
        await this.saveToStorage()
      } catch (error) {
        console.error('删除窗口模板失败:', error)
        throw error
      }
    },

    /**
     * 复制模板
     */
    async duplicateTemplate(id) {
      try {
        const original = this.templates.find(t => t.id === id)
        if (!original) {
          throw new Error('模板不存在')
        }

        console.log('复制窗口模板:', id)
        const duplicate = {
          ...original,
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${original.name} (副本)`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        this.templates.push(duplicate)
        await this.saveToStorage()
        return duplicate
      } catch (error) {
        console.error('复制窗口模板失败:', error)
        throw error
      }
    },

    /**
     * 打开窗口模板
     */
    async openTemplate(id, options = {}) {
      try {
        if (typeof chrome === 'undefined' || !chrome.windows || !chrome.tabs) {
          throw new Error('此功能需要在 Chrome 扩展环境中运行')
        }

        const template = this.templates.find(t => t.id === id)
        if (!template) {
          throw new Error('模板不存在')
        }

        console.log('打开窗口模板:', template.name)

        const collectionsStore = useCollectionsStore()

        // 创建新窗口
        const newWindow = await chrome.windows.create({
          focused: options.inBackground ? false : true
        })

        const createdTabs = []
        let currentIndex = 0

        // 处理标签页组
        for (const collectionData of template.collections) {
          let tabs = []

          // 如果是引用模式，从 collectionsStore 获取最新数据
          if (collectionData.isReference && collectionData.collectionId) {
            const collection = collectionsStore.getCollectionById(collectionData.collectionId)
            if (collection) {
              console.log('使用引用模式，加载收藏集:', collection.name)
              tabs = collection.tabs
            } else {
              console.warn('引用的收藏集不存在，使用快照数据:', collectionData.collectionId)
              tabs = collectionData.tabs
            }
          } else {
            // 快照模式，使用保存的数据
            console.log('使用快照模式')
            tabs = collectionData.tabs
          }

          // 批量创建标签页
          const groupTabIds = []
          for (const tab of tabs) {
            try {
              const newTab = await chrome.tabs.create({
                windowId: newWindow.id,
                url: tab.url,
                active: false,
                index: currentIndex++
              })
              groupTabIds.push(newTab.id)
              createdTabs.push(newTab)
            } catch (error) {
              console.error('创建标签页失败:', tab.url, error)
            }
          }

          // 如果需要创建 Tab Group
          if (collectionData.createGroup && groupTabIds.length > 0 && chrome.tabGroups) {
            try {
              const groupId = await chrome.tabs.group({
                tabIds: groupTabIds,
                createProperties: { windowId: newWindow.id }
              })

              await chrome.tabGroups.update(groupId, {
                title: collectionData.name,
                color: collectionData.color || 'grey'
              })

              console.log('已创建 Tab Group:', collectionData.name)
            } catch (error) {
              console.error('创建 Tab Group 失败:', error)
            }
          }
        }

        // 处理独立标签页
        for (const tab of template.standaloneTabs) {
          try {
            const newTab = await chrome.tabs.create({
              windowId: newWindow.id,
              url: tab.url,
              active: false,
              pinned: tab.pinned || false,
              index: currentIndex++
            })
            createdTabs.push(newTab)
          } catch (error) {
            console.error('创建独立标签页失败:', tab.url, error)
          }
        }

        // 关闭初始创建窗口时的空白标签页
        const initialTabs = await chrome.tabs.query({ windowId: newWindow.id })
        const emptyTab = initialTabs.find(tab => tab.url === 'chrome://newtab/')
        if (emptyTab && createdTabs.length > 0) {
          await chrome.tabs.remove(emptyTab.id)
        }

        console.log('窗口模板已打开，共创建', createdTabs.length, '个标签页')
        return newWindow
      } catch (error) {
        console.error('打开窗口模板失败:', error)
        throw error
      }
    },

    /**
     * 添加收藏集到模板
     */
    async addCollectionToTemplate(templateId, collectionId, isReference = true, createGroup = true) {
      try {
        const template = this.templates.find(t => t.id === templateId)
        if (!template) {
          throw new Error('模板不存在')
        }

        const collectionsStore = useCollectionsStore()
        const collection = collectionsStore.getCollectionById(collectionId)
        if (!collection) {
          throw new Error('收藏集不存在')
        }

        console.log('添加收藏集到模板:', collection.name)

        const collectionData = {
          collectionId: isReference ? collectionId : null,
          name: collection.name,
          color: collection.color,
          createGroup,
          isReference,
          tabs: [...collection.tabs]
        }

        template.collections.push(collectionData)
        template.updatedAt = Date.now()

        await this.saveToStorage()
        return template
      } catch (error) {
        console.error('添加收藏集到模板失败:', error)
        throw error
      }
    },

    /**
     * 从模板中移除收藏集
     */
    async removeCollectionFromTemplate(templateId, collectionIndex) {
      try {
        const template = this.templates.find(t => t.id === templateId)
        if (!template) {
          throw new Error('模板不存在')
        }

        console.log('从模板移除收藏集，索引:', collectionIndex)
        template.collections.splice(collectionIndex, 1)
        template.updatedAt = Date.now()

        await this.saveToStorage()
        return template
      } catch (error) {
        console.error('从模板移除收藏集失败:', error)
        throw error
      }
    },

    /**
     * 清空所有模板（用于测试）
     */
    async clearAllTemplates() {
      try {
        console.log('清空所有窗口模板')
        this.templates = []
        await this.saveToStorage()
      } catch (error) {
        console.error('清空窗口模板失败:', error)
        throw error
      }
    }
  }
})
