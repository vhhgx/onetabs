import { defineStore } from 'pinia'
import { chromeStorageGet, chromeStorageSet } from '../utils/chrome-storage.js'
import errorHandler from '../utils/errorHandler.js'

const STORAGE_KEY = 'onetabs_bookmarks'

/**
 * 书签管理 Store
 * 管理三级分类结构的书签数据
 */
export const useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    // 主书签数据（三级分类树结构）
    bookmarks: [],
    // 固定的书签数组
    pinnedBookmarks: [],
    // 收藏的书签数组
    favoriteBookmarks: [],
    // 当前选中的一级分类ID
    currentFirstLevel: null,
    // 当前选中的二级分类ID
    currentSecondLevel: null,
    // 当前选中的三级分类ID
    currentThirdLevel: null,
    // 加载状态
    isLoading: false,
    // 最后加载时间
    lastLoaded: null,
  }),

  getters: {
    /**
     * 获取所有一级分类
     */
    getFirstLevelCategories: (state) => {
      return state.bookmarks || []
    },

    /**
     * 获取指定一级分类下的二级分类
     */
    getSecondLevelCategories: (state) => (firstLevelId) => {
      const firstLevel = state.bookmarks.find((cat) => cat.id === firstLevelId)
      return firstLevel?.children || []
    },

    /**
     * 获取指定二级分类下的三级分类
     */
    getThirdLevelCategories: (state) => (firstLevelId, secondLevelId) => {
      const firstLevel = state.bookmarks.find((cat) => cat.id === firstLevelId)
      const secondLevel = firstLevel?.children?.find((cat) => cat.id === secondLevelId)
      return secondLevel?.children || []
    },

    /**
     * 根据ID获取分类（任意层级）
     */
    getCategoryById: (state) => (id) => {
      // 递归查找函数
      const findCategory = (categories) => {
        for (const cat of categories) {
          if (cat.id === id) return cat
          if (cat.children) {
            const found = findCategory(cat.children)
            if (found) return found
          }
        }
        return null
      }
      return findCategory(state.bookmarks)
    },

    /**
     * 获取指定分类路径下的书签
     * @param {Object} categoryPath - { first, second, third }
     */
    getBookmarks: (state) => (categoryPath) => {
      if (!categoryPath) return []

      const { first, second, third } = categoryPath

      // 查找一级分类
      const firstLevel = state.bookmarks.find((cat) => cat.id === first)
      if (!firstLevel) return []

      // 递归收集所有书签
      const collectAllBookmarks = (category) => {
        let bookmarks = [...(category.bookmarks || [])]
        if (category.children) {
          category.children.forEach((child) => {
            bookmarks = bookmarks.concat(collectAllBookmarks(child))
          })
        }
        return bookmarks
      }

      // 如果只有一级分类，返回该分类及其所有子分类的书签
      if (!second) {
        return collectAllBookmarks(firstLevel)
      }

      // 查找二级分类
      const secondLevel = firstLevel.children?.find((cat) => cat.id === second)
      if (!secondLevel) return []

      // 如果只有二级分类，返回该分类及其所有子分类的书签
      if (!third) {
        return collectAllBookmarks(secondLevel)
      }

      // 查找三级分类
      const thirdLevel = secondLevel.children?.find((cat) => cat.id === third)
      return thirdLevel?.bookmarks || []
    },

    /**
     * 获取所有固定书签
     */
    getPinnedBookmarks: (state) => {
      return state.pinnedBookmarks || []
    },

    /**
     * 获取所有收藏书签
     */
    getFavoriteBookmarks: (state) => {
      return state.favoriteBookmarks || []
    },

    /**
     * 获取所有书签总数
     */
    getTotalBookmarksCount: (state) => {
      const countBookmarks = (categories) => {
        let count = 0
        for (const cat of categories) {
          if (cat.bookmarks) {
            count += cat.bookmarks.length
          }
          if (cat.children) {
            count += countBookmarks(cat.children)
          }
        }
        return count
      }
      return countBookmarks(state.bookmarks)
    },

    /**
     * 获取当前选中的一级分类ID
     */
    getCurrentFirstLevel: (state) => {
      return state.currentFirstLevel
    },

    /**
     * 获取当前选中的二级分类ID
     */
    getCurrentSecondLevel: (state) => {
      return state.currentSecondLevel
    },

    /**
     * 获取当前选中的三级分类ID
     */
    getCurrentThirdLevel: (state) => {
      return state.currentThirdLevel
    },

    /**
     * 搜索书签
     */
    searchBookmarks: (state) => (keyword) => {
      if (!keyword) return []

      const results = []
      const searchText = keyword.toLowerCase()

      const searchInCategories = (categories, path = []) => {
        for (const cat of categories) {
          const currentPath = [...path, cat]

          // 搜索当前分类的书签
          if (cat.bookmarks) {
            for (const bookmark of cat.bookmarks) {
              const matchName = bookmark.name?.toLowerCase().includes(searchText)
              const matchUrl = bookmark.url?.toLowerCase().includes(searchText)
              const matchDesc = bookmark.description?.toLowerCase().includes(searchText)
              const matchTags = bookmark.tags?.some((tag) => tag.toLowerCase().includes(searchText))

              if (matchName || matchUrl || matchDesc || matchTags) {
                results.push({
                  ...bookmark,
                  categoryPath: currentPath.map((c) => ({ id: c.id, name: c.name })),
                })
              }
            }
          }

          // 递归搜索子分类
          if (cat.children) {
            searchInCategories(cat.children, currentPath)
          }
        }
      }

      searchInCategories(state.bookmarks)
      return results
    },
  },

  actions: {
    /**
     * 设置当前选中的一级分类
     */
    setCurrentFirstLevel(categoryId) {
      this.currentFirstLevel = categoryId
      // 切换一级分类时，清空二三级选择
      this.currentSecondLevel = null
      this.currentThirdLevel = null
    },

    /**
     * 设置当前选中的二级分类
     */
    setCurrentSecondLevel(categoryId) {
      this.currentSecondLevel = categoryId
      // 切换二级分类时，清空三级选择
      this.currentThirdLevel = null
    },

    /**
     * 设置当前选中的三级分类
     */
    setCurrentThirdLevel(categoryId) {
      this.currentThirdLevel = categoryId
    },

    /**
     * 从 chrome.storage 加载书签数据
     */
    async loadBookmarks() {
      this.isLoading = true
      try {
        const result = await chromeStorageGet(STORAGE_KEY)
        const data = result[STORAGE_KEY] // 正确获取嵌套的数据

        if (data && this.validateBookmarksData(data)) {
          this.bookmarks = data.bookmarks || []
          this.pinnedBookmarks = data.pinnedBookmarks || []
          this.favoriteBookmarks = data.favoriteBookmarks || []
          this.lastLoaded = Date.now()

          // 如果有数据但没有选中分类，默认选中第一个一级分类
          if (this.bookmarks.length > 0 && !this.currentFirstLevel) {
            this.currentFirstLevel = this.bookmarks[0].id
          }
        } else {
          // 首次运行，初始化默认数据
          await this.initializeWithDefaults()
        }
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.loadBookmarks')
        // 初始化默认数据作为降级方案
        await this.initializeWithDefaults()
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 保存书签数据到 chrome.storage
     */
    async saveBookmarks() {
      try {
        const data = {
          bookmarks: this.bookmarks,
          pinnedBookmarks: this.pinnedBookmarks,
          favoriteBookmarks: this.favoriteBookmarks,
          lastUpdated: Date.now(),
        }

        // 保存前验证数据
        if (!this.validateBookmarksData(data)) {
          throw new Error('书签数据验证失败')
        }

        await chromeStorageSet(STORAGE_KEY, data)
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.saveBookmarks')
        throw error
      }
    },

    /**
     * 初始化默认书签数据
     */
    async initializeWithDefaults() {
      this.bookmarks = [
        {
          id: `cat-${Date.now()}-1`,
          name: '常用网站',
          icon: 'pi-star',
          color: '#3b82f6',
          children: [
            {
              id: `cat-${Date.now()}-1-1`,
              name: '搜索引擎',
              icon: 'pi-search',
              children: [],
              bookmarks: [
                {
                  id: `bookmark-${Date.now()}-1`,
                  name: 'Google',
                  url: 'https://www.google.com',
                  description: '全球最大的搜索引擎',
                  favIconUrl: 'https://www.google.com/favicon.ico',
                  tags: ['搜索', '工具'],
                  sourceGroup: '默认',
                  createdAt: Date.now(),
                  visitCount: 0,
                },
              ],
            },
          ],
          bookmarks: [],
        },
      ]

      this.pinnedBookmarks = []
      this.favoriteBookmarks = []
      this.lastLoaded = Date.now()

      // 设置默认选中第一个分类
      if (this.bookmarks.length > 0) {
        this.currentFirstLevel = this.bookmarks[0].id
      }

      await this.saveBookmarks()
    },

    /**
     * 验证书签数据格式
     */
    validateBookmarksData(data) {
      if (!data || typeof data !== 'object') return false
      if (!Array.isArray(data.bookmarks)) return false
      if (!Array.isArray(data.pinnedBookmarks)) return false
      if (!Array.isArray(data.favoriteBookmarks)) return false
      return true
    },

    /**
     * 生成唯一ID
     */
    generateId(prefix = 'id') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    // ==================== 分类操作 ====================

    /**
     * 添加一级分类
     */
    async addFirstLevelCategory(category) {
      try {
        const newCategory = {
          id: this.generateId('cat'),
          name: category.name,
          icon: category.icon || 'pi-folder',
          color: category.color || '#3b82f6',
          children: [],
          bookmarks: [],
        }

        this.bookmarks.push(newCategory)
        await this.saveBookmarks()
        return newCategory
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.addFirstLevelCategory')
        throw error
      }
    },

    /**
     * 添加二级分类
     */
    async addSecondLevelCategory(firstLevelId, category) {
      try {
        const firstLevel = this.bookmarks.find((cat) => cat.id === firstLevelId)
        if (!firstLevel) {
          throw new Error('未找到一级分类')
        }

        const newCategory = {
          id: this.generateId('cat'),
          name: category.name,
          icon: category.icon || 'pi-folder-open',
          children: [],
          bookmarks: [],
        }

        if (!firstLevel.children) {
          firstLevel.children = []
        }
        firstLevel.children.push(newCategory)

        await this.saveBookmarks()
        return newCategory
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.addSecondLevelCategory')
        throw error
      }
    },

    /**
     * 添加三级分类
     */
    async addThirdLevelCategory(firstLevelId, secondLevelId, category) {
      try {
        const firstLevel = this.bookmarks.find((cat) => cat.id === firstLevelId)
        if (!firstLevel) {
          throw new Error('未找到一级分类')
        }

        const secondLevel = firstLevel.children?.find((cat) => cat.id === secondLevelId)
        if (!secondLevel) {
          throw new Error('未找到二级分类')
        }

        const newCategory = {
          id: this.generateId('cat'),
          name: category.name,
          icon: category.icon || 'pi-folder-open',
          bookmarks: [],
        }

        if (!secondLevel.children) {
          secondLevel.children = []
        }
        secondLevel.children.push(newCategory)

        await this.saveBookmarks()
        return newCategory
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.addThirdLevelCategory')
        throw error
      }
    },

    /**
     * 更新分类
     */
    async updateCategory(categoryId, updates) {
      try {
        const category = this.getCategoryById(categoryId)
        if (!category) {
          throw new Error('未找到分类')
        }

        Object.assign(category, updates)
        await this.saveBookmarks()
        return category
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.updateCategory')
        throw error
      }
    },

    /**
     * 删除分类
     */
    async deleteCategory(categoryId) {
      try {
        // 递归删除函数
        const removeCategory = (categories) => {
          for (let i = 0; i < categories.length; i++) {
            if (categories[i].id === categoryId) {
              categories.splice(i, 1)
              return true
            }
            if (categories[i].children && removeCategory(categories[i].children)) {
              return true
            }
          }
          return false
        }

        const removed = removeCategory(this.bookmarks)
        if (!removed) {
          throw new Error('未找到要删除的分类')
        }

        await this.saveBookmarks()
        return true
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.deleteCategory')
        throw error
      }
    },

    // ==================== 书签操作 ====================

    /**
     * 添加书签
     * @param {Object} categoryPath - { first, second, third }
     * @param {Object} bookmark - 书签对象
     */
    async addBookmark(categoryPath, bookmark) {
      try {
        const { first, second, third } = categoryPath

        // 查找目标分类
        const firstLevel = this.bookmarks.find((cat) => cat.id === first)
        if (!firstLevel) {
          throw new Error('未找到一级分类')
        }

        let targetCategory = firstLevel

        if (second) {
          const secondLevel = firstLevel.children?.find((cat) => cat.id === second)
          if (!secondLevel) {
            throw new Error('未找到二级分类')
          }
          targetCategory = secondLevel

          if (third) {
            const thirdLevel = secondLevel.children?.find((cat) => cat.id === third)
            if (!thirdLevel) {
              throw new Error('未找到三级分类')
            }
            targetCategory = thirdLevel
          }
        }

        // 创建新书签
        const newBookmark = {
          id: this.generateId('bookmark'),
          name: bookmark.name,
          url: bookmark.url,
          description: bookmark.description || '',
          favIconUrl: bookmark.favIconUrl || this.generateFavIconUrl(bookmark.url),
          tags: bookmark.tags || [],
          sourceGroup: bookmark.sourceGroup || '手动添加',
          createdAt: Date.now(),
          visitCount: 0,
          pinned: false,
          favorite: false,
        }

        if (!targetCategory.bookmarks) {
          targetCategory.bookmarks = []
        }
        targetCategory.bookmarks.push(newBookmark)

        await this.saveBookmarks()
        return newBookmark
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.addBookmark')
        throw error
      }
    },

    /**
     * 更新书签
     */
    async updateBookmark(bookmarkId, updates) {
      try {
        // 递归查找书签
        const findBookmark = (categories) => {
          for (const cat of categories) {
            if (cat.bookmarks) {
              const bookmark = cat.bookmarks.find((b) => b.id === bookmarkId)
              if (bookmark) return bookmark
            }
            if (cat.children) {
              const found = findBookmark(cat.children)
              if (found) return found
            }
          }
          return null
        }

        const bookmark = findBookmark(this.bookmarks)
        if (!bookmark) {
          throw new Error('未找到书签')
        }

        Object.assign(bookmark, updates)
        await this.saveBookmarks()
        return bookmark
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.addBookmark')
        throw error
      }
    },

    /**
     * 删除书签
     */
    async deleteBookmark(bookmarkId) {
      try {
        // 递归删除函数
        const removeBookmark = (categories) => {
          for (const cat of categories) {
            if (cat.bookmarks) {
              const index = cat.bookmarks.findIndex((b) => b.id === bookmarkId)
              if (index !== -1) {
                cat.bookmarks.splice(index, 1)
                return true
              }
            }
            if (cat.children && removeBookmark(cat.children)) {
              return true
            }
          }
          return false
        }

        const removed = removeBookmark(this.bookmarks)
        if (!removed) {
          throw new Error('未找到要删除的书签')
        }

        // 同时从固定和收藏列表中移除
        this.pinnedBookmarks = this.pinnedBookmarks.filter((b) => b.id !== bookmarkId)
        this.favoriteBookmarks = this.favoriteBookmarks.filter((b) => b.id !== bookmarkId)

        await this.saveBookmarks()
        return true
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.deleteBookmark')
        throw error
      }
    },

    // ==================== 固定功能 ====================

    /**
     * 根据ID查找书签
     */
    findBookmarkById(bookmarkId) {
      const findInCategories = (categories) => {
        for (const cat of categories) {
          if (cat.bookmarks) {
            const bookmark = cat.bookmarks.find((b) => b.id === bookmarkId)
            if (bookmark) return bookmark
          }
          if (cat.children) {
            const found = findInCategories(cat.children)
            if (found) return found
          }
        }
        return null
      }
      return findInCategories(this.bookmarks)
    },

    /**
     * 固定书签
     */
    async pinBookmark(bookmark) {
      try {
        // 检查是否已固定
        const alreadyPinned = this.pinnedBookmarks.some((b) => b.id === bookmark.id)
        if (alreadyPinned) {
          return
        }

        // 添加到固定列表
        this.pinnedBookmarks.push({ ...bookmark })

        // 更新书签的 isPinned 字段
        await this.updateBookmark(bookmark.id, { isPinned: true })

        await this.saveBookmarks()
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.updateCategory')
        throw error
      }
    },

    /**
     * 取消固定书签
     */
    async unpinBookmark(bookmarkId) {
      try {
        // 从固定列表移除
        this.pinnedBookmarks = this.pinnedBookmarks.filter((b) => b.id !== bookmarkId)

        // 更新书签的 isPinned 字段
        await this.updateBookmark(bookmarkId, { isPinned: false })

        await this.saveBookmarks()
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.updateBookmark')
        throw error
      }
    },

    /**
     * 收藏书签
     */
    async favoriteBookmark(bookmarkId) {
      try {
        // 查找书签
        const bookmark = this.findBookmarkById(bookmarkId)
        if (!bookmark) {
          throw new Error('未找到书签')
        }

        // 检查是否已收藏
        const alreadyFavorited = this.favoriteBookmarks.some((b) => b.id === bookmark.id)
        if (alreadyFavorited) {
          return
        }

        // 添加到收藏列表
        this.favoriteBookmarks.push({ ...bookmark })

        // 更新书签的 isFavorite 字段
        await this.updateBookmark(bookmark.id, { isFavorite: true })

        await this.saveBookmarks()
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.favoriteBookmark')
        throw error
      }
    },

    /**
     * 取消收藏书签
     */
    async unfavoriteBookmark(bookmarkId) {
      try {
        // 从收藏列表移除
        this.favoriteBookmarks = this.favoriteBookmarks.filter((b) => b.id !== bookmarkId)

        // 更新书签的 isFavorite 字段
        await this.updateBookmark(bookmarkId, { isFavorite: false })

        await this.saveBookmarks()
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.unfavoriteBookmark')
        throw error
      }
    },

    // ==================== 辅助函数 ====================

    /**
     * 生成 Favicon URL
     */
    generateFavIconUrl(url) {
      try {
        const urlObj = new URL(url)
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
      } catch {
        return ''
      }
    },

    /**
     * 替换所有书签数据（用于导入）
     * @param {Array} newBookmarks - 新的书签数组
     */
    async replaceAllBookmarks(newBookmarks) {
      try {
        this.bookmarks = newBookmarks

        // 重新收集 pinnedBookmarks 和 favoriteBookmarks
        this.pinnedBookmarks = []
        this.favoriteBookmarks = []

        const collectBookmarks = (category) => {
          if (category.bookmarks) {
            category.bookmarks.forEach((bookmark) => {
              if (bookmark.isPinned) {
                this.pinnedBookmarks.push(bookmark)
              }
              if (bookmark.isFavorite) {
                this.favoriteBookmarks.push(bookmark)
              }
            })
          }
          if (category.children) {
            category.children.forEach((child) => collectBookmarks(child))
          }
        }

        this.bookmarks.forEach((category) => collectBookmarks(category))

        await this.saveBookmarks()
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.replaceAllBookmarks')
        throw error
      }
    },

    /**
     * 导入书签（用于从外部导入）
     * @param {Array} importedBookmarks - 导入的书签数组
     */
    async importBookmarks(importedBookmarks) {
      try {
        await this.replaceAllBookmarks(importedBookmarks)

        // 重新加载以确保状态同步
        await this.loadBookmarks()

        // 导入后自动选中第一个分类
        if (this.bookmarks.length > 0) {
          this.currentFirstLevel = this.bookmarks[0].id
        }
      } catch (error) {
        errorHandler.handleError(error, 'bookmarksStore.importBookmarks')
        throw error
      }
    },
  },
})
