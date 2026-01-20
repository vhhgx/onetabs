import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'

/**
 * Settings Store - 管理应用设置
 */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 自动关闭标签页（点击扩展图标后）
    autoClose: true,
    // 保留固定标签页
    keepPinned: false,
    // 最大保存会话数量
    maxSessions: 50,
    // 是否加载完成
    isLoaded: false,
  }),

  getters: {
    /**
     * 获取所有设置
     */
    getSettings: (state) => ({
      autoClose: state.autoClose,
      keepPinned: state.keepPinned,
      maxSessions: state.maxSessions,
    }),
  },

  actions: {
    /**
     * 从 Storage 加载设置
     */
    async loadSettings() {
      try {
        const data = await chromeStorageGet('onetabs_settings')
        if (data && data.onetabs_settings) {
          const settings = data.onetabs_settings
          this.autoClose = settings.autoClose ?? true
          this.keepPinned = settings.keepPinned ?? false
          this.maxSessions = settings.maxSessions ?? 50
        }
        this.isLoaded = true
      } catch (error) {
        console.error('加载设置失败:', error)
        // 使用默认值
        this.isLoaded = true
      }
    },

    /**
     * 保存设置到 Storage
     */
    async saveSettings() {
      try {
        await chromeStorageSet('onetabs_settings', {
          autoClose: this.autoClose,
          keepPinned: this.keepPinned,
          maxSessions: this.maxSessions,
        })
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    },

    /**
     * 更新单个设置项
     * @param {string} key - 设置项名称
     * @param {any} value - 设置项值
     */
    async updateSetting(key, value) {
      try {
        if (key in this.$state) {
          this[key] = value
          await this.saveSettings()
          return true
        }
        return false
      } catch (error) {
        console.error('更新设置失败:', error)
        throw error
      }
    },

    /**
     * 重置为默认设置
     */
    async resetSettings() {
      try {
        this.autoClose = true
        this.keepPinned = false
        this.maxSessions = 50
        await this.saveSettings()
        return true
      } catch (error) {
        console.error('重置设置失败:', error)
        throw error
      }
    },
  },
})
