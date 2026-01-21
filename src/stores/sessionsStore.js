import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'
import { errorHandler } from '../utils/errorHandler'

/**
 * Sessions Store - 管理会话收纳数据
 * 会话是每次点击扩展图标时保存的标签页快照
 */
export const useSessionsStore = defineStore('sessions', {
  state: () => ({
    // 所有会话列表（按时间倒序）
    sessions: [],
    // 当前查看的会话
    currentSession: null,
    // 加载状态
    isLoading: false,
    // 最后加载时间
    lastLoaded: null,
  }),

  getters: {
    /**
     * 获取所有会话
     */
    getSessions: (state) => state.sessions,

    /**
     * 获取置顶的会话
     */
    getPinnedSessions: (state) => state.sessions.filter((session) => session.isPinned),

    /**
     * 获取非置顶的会话
     */
    getUnpinnedSessions: (state) => state.sessions.filter((session) => !session.isPinned),

    /**
     * 根据ID获取会话
     */
    getSessionById: (state) => (id) => {
      return state.sessions.find((session) => session.date === id)
    },

    /**
     * 获取会话总数
     */
    getTotalCount: (state) => state.sessions.length,

    /**
     * 获取所有标签页总数
     */
    getTotalTabsCount: (state) => {
      return state.sessions.reduce((total, session) => {
        return total + (session.tabs?.length || 0)
      }, 0)
    },
  },

  actions: {
    /**
     * 从 Storage 加载所有会话
     */
    async loadSessions() {
      this.isLoading = true
      try {
        const data = await chromeStorageGet('tabGroups')
        console.log('加载的原始数据:', data)
        
        // 处理不同的数据格式
        let sessionsList = []
        if (data) {
          // Chrome扩展环境：data = { tabGroups: [...] }
          if (data.tabGroups && Array.isArray(data.tabGroups)) {
            sessionsList = data.tabGroups
          }
          // localStorage环境：data = {...}，需要检查是否直接是数组
          else if (Array.isArray(data)) {
            sessionsList = data
          }
        }
        
        this.sessions = sessionsList
        console.log('加载的会话数量:', this.sessions.length)
        this.lastLoaded = new Date().toISOString()
      } catch (error) {
        errorHandler.handleStorageError(error, '加载会话失败')
        this.sessions = []
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 保存会话到 Storage
     */
    async saveSessions() {
      try {
        console.log('保存会话数量:', this.sessions.length)
        await chromeStorageSet('tabGroups', this.sessions)
        console.log('会话保存成功')
      } catch (error) {
        errorHandler.handleStorageError(error, '保存会话失败')
        throw error
      }
    },

    /**
     * 保存新会话（由 background.js 调用）
     */
    async saveSession(sessionData) {
      try {
        console.log('准备保存新会话:', sessionData)
        // 添加到会话列表开头
        this.sessions.unshift(sessionData)
        console.log('当前会话列表长度:', this.sessions.length)
        await this.saveSessions()
        console.log('新会话保存完成')
      } catch (error) {
        errorHandler.handleStorageError(error, '保存新会话失败')
        throw error
      }
    },

    /**
     * 删除指定会话
     * @param {number} sessionId - 会话ID（时间戳）
     */
    async deleteSession(sessionId) {
      try {
        const index = this.sessions.findIndex((session) => session.date === sessionId)
        if (index !== -1) {
          this.sessions.splice(index, 1)
          await this.saveSessions()
          return true
        }
        return false
      } catch (error) {
        errorHandler.handleStorageError(error, '删除会话失败')
        throw error
      }
    },

    /**
     * 切换会话置顶状态
     * @param {number} sessionId - 会话ID
     */
    async togglePinSession(sessionId) {
      try {
        const session = this.sessions.find((s) => s.date === sessionId)
        if (session) {
          session.isPinned = !session.isPinned
          
          // 重新排序：置顶的在前，非置顶的按时间倒序
          this.sessions.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return b.date - a.date
          })
          
          await this.saveSessions()
          return true
        }
        return false
      } catch (error) {
        console.error('切换置顶失败:', error)
        throw error
      }
    },

    /**
     * 恢复整个会话（在新窗口中打开所有标签页）
     * @param {number} sessionId - 会话ID
     */
    async restoreSession(sessionId) {
      try {
        const session = this.sessions.find((s) => s.date === sessionId)
        if (!session) {
          throw new Error('会话不存在')
        }

        // 创建新窗口
        const newWindow = await chrome.windows.create({ focused: true })

        // 恢复所有标签页
        const tabIds = []
        for (const tab of session.tabs || []) {
          const newTab = await chrome.tabs.create({
            windowId: newWindow.id,
            url: tab.url,
            active: false,
          })
          tabIds.push(newTab.id)
        }

        // 如果有标签页组信息，重建分组
        if (session.groupInfo && tabIds.length > 0) {
          const groupId = await chrome.tabs.group({
            tabIds: tabIds,
            createProperties: { windowId: newWindow.id },
          })

          await chrome.tabGroups.update(groupId, {
            title: session.groupInfo.title || session.title,
            color: session.groupInfo.color || 'grey',
          })
        }

        return true
      } catch (error) {
        console.error('恢复会话失败:', error)
        throw error
      }
    },

    /**
     * 恢复单个标签页组
     * @param {number} sessionId - 会话ID
     * @param {number} groupId - 组ID（可选，用于多组会话）
     */
    async restoreGroup(sessionId, groupId = null) {
      try {
        const session = this.sessions.find((s) => s.date === sessionId)
        if (!session) {
          throw new Error('会话不存在')
        }

        // 创建新窗口
        const newWindow = await chrome.windows.create({ focused: true })

        // 创建所有标签
        const tabIds = []
        for (const tab of session.tabs || []) {
          const newTab = await chrome.tabs.create({
            windowId: newWindow.id,
            url: tab.url,
            active: false,
          })
          tabIds.push(newTab.id)
        }

        // 如果是分组类型，创建标签页组
        if (session.type === 'grouped' && session.groupInfo && tabIds.length > 0) {
          const newGroupId = await chrome.tabs.group({
            tabIds: tabIds,
            createProperties: { windowId: newWindow.id },
          })

          await chrome.tabGroups.update(newGroupId, {
            title: session.groupInfo.title || session.title,
            color: session.groupInfo.color || 'grey',
          })
        }

        return true
      } catch (error) {
        console.error('恢复标签页组失败:', error)
        throw error
      }
    },

    /**
     * 恢复单个标签页
     * @param {number} sessionId - 会话ID
     * @param {string} tabUrl - 标签页URL
     */
    async restoreTab(sessionId, tabUrl) {
      try {
        await chrome.tabs.create({ url: tabUrl })
        return true
      } catch (error) {
        console.error('恢复标签页失败:', error)
        throw error
      }
    },

    /**
     * 清空所有会话
     */
    async clearAllSessions() {
      try {
        this.sessions = []
        await this.saveSessions()
        return true
      } catch (error) {
        errorHandler.handleError(error, '切换置顶状态失败')
        throw error
      }
    },

    /**
     * 清空非置顶会话
     */
    async clearUnpinnedSessions() {
      try {
        this.sessions = this.sessions.filter((session) => session.isPinned)
        await this.saveSessions()
        return true
      } catch (error) {
        console.error('清空非置顶会话失败:', error)
        throw error
      }
    },
  },
})
