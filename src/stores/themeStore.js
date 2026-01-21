import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage'

/**
 * Theme Store - 管理应用主题
 */
export const useThemeStore = defineStore('theme', {
  state: () => ({
    // 当前主题: 'light' | 'dark' | 'auto'
    currentTheme: 'light',
    // 是否跟随系统
    followSystem: false,
    // 系统主题偏好
    systemPreference: 'light',
  }),

  getters: {
    /**
     * 获取实际应用的主题
     */
    activeTheme: (state) => {
      if (state.followSystem) {
        return state.systemPreference
      }
      return state.currentTheme
    },

    /**
     * 是否为暗色主题
     */
    isDark: (state) => {
      const theme = state.followSystem ? state.systemPreference : state.currentTheme
      return theme === 'dark'
    },
  },

  actions: {
    /**
     * 从 Storage 加载主题设置
     */
    async loadTheme() {
      try {
        const data = await chromeStorageGet('onetabs_theme')
        if (data && data.onetabs_theme) {
          const theme = data.onetabs_theme
          this.currentTheme = theme.currentTheme || 'light'
          this.followSystem = theme.followSystem || false
        }

        // 检测系统主题偏好
        this.detectSystemTheme()

        // 监听系统主题变化
        this.watchSystemTheme()

        // 应用主题
        this.applyTheme()
      } catch (error) {
        console.error('加载主题失败:', error)
      }
    },

    /**
     * 保存主题设置到 Storage
     */
    async saveTheme() {
      try {
        await chromeStorageSet('onetabs_theme', {
          currentTheme: this.currentTheme,
          followSystem: this.followSystem,
        })
      } catch (error) {
        console.error('保存主题失败:', error)
        throw error
      }
    },

    /**
     * 设置主题
     * @param {string} theme - 主题名称: 'light' | 'dark'
     */
    async setTheme(theme) {
      try {
        this.currentTheme = theme
        this.followSystem = false
        await this.saveTheme()
        this.applyTheme()
      } catch (error) {
        console.error('设置主题失败:', error)
        throw error
      }
    },

    /**
     * 切换跟随系统设置
     * @param {boolean} follow - 是否跟随系统
     */
    async setFollowSystem(follow) {
      try {
        this.followSystem = follow
        await this.saveTheme()
        this.applyTheme()
      } catch (error) {
        console.error('设置跟随系统失败:', error)
        throw error
      }
    },

    /**
     * 检测系统主题偏好
     */
    detectSystemTheme() {
      if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
        this.systemPreference = darkModeQuery.matches ? 'dark' : 'light'
      }
    },

    /**
     * 监听系统主题变化
     */
    watchSystemTheme() {
      if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
        darkModeQuery.addEventListener('change', (e) => {
          this.systemPreference = e.matches ? 'dark' : 'light'
          if (this.followSystem) {
            this.applyTheme()
          }
        })
      }
    },

    /**
     * 应用主题到DOM
     */
    applyTheme() {
      const theme = this.followSystem ? this.systemPreference : this.currentTheme
      const root = document.documentElement

      // 移除旧主题类
      root.classList.remove('theme-light', 'theme-dark')

      // 添加新主题类
      root.classList.add(`theme-${theme}`)

      // 设置 data 属性（可选）
      root.setAttribute('data-theme', theme)
    },

    /**
     * 切换主题（亮色 <-> 暗色）
     */
    async toggleTheme() {
      const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
      await this.setTheme(newTheme)
    },
  },
})
