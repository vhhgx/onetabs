/**
 * 书签导入工具
 * 支持从Chrome书签HTML文件和chrome.bookmarks API导入
 */

import { getFavIconUrl } from './urlValidator'

/**
 * 解析Chrome书签HTML文件
 * @param {string} htmlContent - HTML文件内容
 * @returns {Object} 解析后的书签结构 { categories: [], bookmarks: [] }
 */
export function parseGoogleBookmarks(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')

  const result = {
    categories: [],
    bookmarks: [],
  }

  // 获取根书签文件夹 (通常是 "Bookmarks bar" 或 "Other bookmarks")
  const rootDLs = doc.querySelectorAll('body > dl > dt')

  rootDLs.forEach((rootDt) => {
    const h3 = rootDt.querySelector('h3')
    if (!h3) return

    const rootFolderName = h3.textContent.trim()
    const dl = rootDt.querySelector('dl')
    if (!dl) return

    // 创建一级分类
    const firstLevelCategory = {
      id: generateId(),
      title: rootFolderName,
      icon: 'folder',
      color: '#3b82f6',
      children: [],
    }

    // 解析子项
    parseFolder(dl, firstLevelCategory, result.bookmarks, 1)

    result.categories.push(firstLevelCategory)
  })

  return result
}

/**
 * 递归解析文件夹
 * @param {Element} dl - DL元素
 * @param {Object} parentCategory - 父级分类
 * @param {Array} bookmarks - 书签列表
 * @param {number} level - 当前层级 (1=一级, 2=二级, 3=三级)
 */
function parseFolder(dl, parentCategory, bookmarks, level) {
  const dts = dl.querySelectorAll(':scope > dt')

  dts.forEach((dt) => {
    const h3 = dt.querySelector('h3')
    const a = dt.querySelector('a')

    if (h3) {
      // 这是一个文件夹
      const folderName = h3.textContent.trim()
      const childDl = dt.querySelector('dl')

      if (level < 3) {
        // 创建子分类 (二级或三级)
        const childCategory = {
          id: generateId(),
          title: folderName,
          icon: 'folder',
          color: level === 1 ? '#3b82f6' : '#6366f1',
          children: level === 2 ? [] : undefined,
        }

        if (!parentCategory.children) {
          parentCategory.children = []
        }
        parentCategory.children.push(childCategory)

        if (childDl) {
          parseFolder(childDl, childCategory, bookmarks, level + 1)
        }
      } else {
        // 已经是三级了，再深的文件夹内的书签直接添加到当前三级分类
        if (childDl) {
          parseFolder(childDl, parentCategory, bookmarks, level)
        }
      }
    } else if (a) {
      // 这是一个书签
      const name = a.textContent.trim()
      const url = a.getAttribute('href')
      const addDate = a.getAttribute('add_date')
      // Chrome 导出的 base64 图标通常是 16x16，太小了
      // 优先使用 Google Favicon 服务获取 64x64 高质量图标
      // const icon = a.getAttribute('ICON') || a.getAttribute('icon')

      if (!url || url === '') return

      const bookmark = {
        id: generateId(),
        title: name || url,
        url: url,
        description: '',
        favIconUrl: getFavIconUrl(url), // 始终使用高质量图标服务
        categoryId: parentCategory.id,
        tags: [],
        isPinned: false,
        isFavorite: false,
        createdAt: addDate ? new Date(parseInt(addDate) * 1000).toISOString() : new Date().toISOString(),
        source: 'chrome',
      }

      bookmarks.push(bookmark)
    }
  })
}

/**
 * 从chrome.bookmarks API导入书签
 * @returns {Promise<Object>} 解析后的书签结构 { categories: [], bookmarks: [] }
 */
export async function importFromChromeApi() {
  if (!chrome || !chrome.bookmarks) {
    throw new Error('Chrome Bookmarks API 不可用')
  }

  const tree = await chrome.bookmarks.getTree()

  const result = {
    categories: [],
    bookmarks: [],
  }

  // Chrome书签树的根节点
  const root = tree[0]
  if (!root || !root.children) return result

  // 通常包含 "Bookmarks Bar" 和 "Other Bookmarks"
  root.children.forEach((rootNode) => {
    if (rootNode.children) {
      const firstLevelCategory = {
        id: generateId(),
        title: rootNode.title || 'Bookmarks',
        icon: 'folder',
        color: '#3b82f6',
        children: [],
      }

      parseChromeNode(rootNode.children, firstLevelCategory, result.bookmarks, 1)

      result.categories.push(firstLevelCategory)
    }
  })

  return result
}

/**
 * 递归解析Chrome书签节点
 * @param {Array} nodes - Chrome书签节点数组
 * @param {Object} parentCategory - 父级分类
 * @param {Array} bookmarks - 书签列表
 * @param {number} level - 当前层级
 */
function parseChromeNode(nodes, parentCategory, bookmarks, level) {
  nodes.forEach((node) => {
    if (node.url) {
      // 这是一个书签
      const bookmark = {
        id: generateId(),
        title: node.title || node.url,
        url: node.url,
        description: '',
        favIconUrl: getFavIconUrl(node.url),
        categoryId: parentCategory.id,
        tags: [],
        isPinned: false,
        isFavorite: false,
        createdAt: node.dateAdded ? new Date(node.dateAdded).toISOString() : new Date().toISOString(),
        source: 'chrome',
      }

      bookmarks.push(bookmark)
    } else if (node.children) {
      // 这是一个文件夹
      if (level < 3) {
        const childCategory = {
          id: generateId(),
          title: node.title || 'Unnamed',
          icon: 'folder',
          color: level === 1 ? '#3b82f6' : '#6366f1',
          children: level === 2 ? [] : undefined,
        }

        if (!parentCategory.children) {
          parentCategory.children = []
        }
        parentCategory.children.push(childCategory)

        parseChromeNode(node.children, childCategory, bookmarks, level + 1)
      } else {
        // 已经是三级，继续添加到当前分类
        parseChromeNode(node.children, parentCategory, bookmarks, level)
      }
    }
  })
}

/**
 * 生成唯一ID
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 合并导入的书签到现有数据
 * @param {Object} currentData - 当前书签数据 { bookmarks: [] }
 * @param {Object} importedData - 导入的数据 { categories: [], bookmarks: [] }
 * @param {string} mode - 合并模式 'merge'(合并) 或 'replace'(替换)
 * @returns {Object} 合并后的数据
 */
export function mergeBookmarks(currentData, importedData, mode = 'merge') {
  if (mode === 'replace') {
    // 替换模式：需要先将书签分配到分类树中
    const categoriesWithBookmarks = assignBookmarksToCategories(importedData.categories, importedData.bookmarks)
    return {
      bookmarks: categoriesWithBookmarks,
      mergedCount: importedData.bookmarks.length,
      skippedCount: 0,
    }
  }

  // 合并模式：将导入的分类和书签合并到现有数据
  const existingUrls = new Set()
  const existingCategoryNames = new Set()

  // 收集现有的URL和分类名称
  currentData.bookmarks.forEach((category) => {
    existingCategoryNames.add(category.title.toLowerCase())
    collectBookmarkUrls(category, existingUrls)
  })

  let mergedCount = 0
  let skippedCount = 0

  // 合并分类和书签
  const mergedBookmarks = [...currentData.bookmarks]

  // 先将书签分配到导入的分类树中
  const categoriesWithBookmarks = assignBookmarksToCategories(importedData.categories, importedData.bookmarks)

  categoriesWithBookmarks.forEach((importedCategory) => {
    const categoryNameLower = importedCategory.title.toLowerCase()

    // 查找是否有同名分类
    const existingCategory = mergedBookmarks.find((cat) => cat.title.toLowerCase() === categoryNameLower)

    if (existingCategory) {
      // 合并到现有分类
      const stats = mergeCategoryWithBookmarks(existingCategory, importedCategory, existingUrls)
      mergedCount += stats.merged
      skippedCount += stats.skipped
    } else {
      // 添加新分类（已经包含书签）
      mergedBookmarks.push(importedCategory)

      // 统计新分类中的书签（递归统计所有子分类中的书签）
      const count = countBookmarksInCategory(importedCategory)
      mergedCount += count
    }
  })

  return {
    bookmarks: mergedBookmarks,
    mergedCount,
    skippedCount,
  }
}

/**
 * 将扁平的书签数组分配到分类树中
 * @param {Array} categories - 分类树
 * @param {Array} bookmarks - 扁平的书签数组
 * @returns {Array} 包含书签的分类树
 */
function assignBookmarksToCategories(categories, bookmarks) {
  // 创建一个深拷贝，避免修改原数据
  const categoriesCopy = JSON.parse(JSON.stringify(categories))

  // 递归分配书签到对应的分类
  function assignToCategory(category) {
    // 找到属于当前分类的书签
    const categoryBookmarks = bookmarks.filter((b) => b.categoryId === category.id)
    if (categoryBookmarks.length > 0) {
      category.tabs = categoryBookmarks
    } else {
      category.tabs = []
    }

    // 递归处理子分类
    if (category.children && category.children.length > 0) {
      category.children.forEach((child) => assignToCategory(child))
    }
  }

  categoriesCopy.forEach((category) => assignToCategory(category))
  return categoriesCopy
}

/**
 * 收集分类及其子分类中的所有书签URL
 */
function collectBookmarkUrls(category, urlSet) {
  if (category.tabs) {
    category.tabs.forEach((b) => urlSet.add(b.url.toLowerCase()))
  }
  if (category.children) {
    category.children.forEach((child) => collectBookmarkUrls(child, urlSet))
  }
}

/**
 * 递归统计分类中的书签数量
 */
function countBookmarksInCategory(category) {
  let count = category.tabs ? category.tabs.length : 0
  if (category.children) {
    category.children.forEach((child) => {
      count += countBookmarksInCategory(child)
    })
  }
  return count
}

/**
 * 合并分类（新版本，分类中已包含书签）
 */
function mergeCategoryWithBookmarks(existingCategory, importedCategory, existingUrls) {
  let merged = 0
  let skipped = 0

  // 添加不重复的书签
  if (!existingCategory.tabs) {
    existingCategory.tabs = []
  }

  if (importedCategory.tabs) {
    importedCategory.tabs.forEach((bookmark) => {
      const urlLower = bookmark.url.toLowerCase()
      if (!existingUrls.has(urlLower)) {
        // 更新 categoryId 为现有分类的 id
        bookmark.categoryId = existingCategory.id
        existingCategory.tabs.push(bookmark)
        existingUrls.add(urlLower)
        merged++
      } else {
        skipped++
      }
    })
  }

  // 合并子分类
  if (importedCategory.children && importedCategory.children.length > 0) {
    if (!existingCategory.children) {
      existingCategory.children = []
    }

    importedCategory.children.forEach((importedChild) => {
      const childNameLower = importedChild.title.toLowerCase()
      const existingChild = existingCategory.children.find((c) => c.title.toLowerCase() === childNameLower)

      if (existingChild) {
        const stats = mergeCategoryWithBookmarks(existingChild, importedChild, existingUrls)
        merged += stats.merged
        skipped += stats.skipped
      } else {
        existingCategory.children.push(importedChild)

        // 统计新子分类中的书签
        merged += countBookmarksInCategory(importedChild)
      }
    })
  }

  return { merged, skipped }
}

/**
 * 合并分类（旧版本，保留用于兼容）
 */
function mergeCategory(existingCategory, importedCategory, allBookmarks, existingUrls) {
  let merged = 0
  let skipped = 0

  // 获取导入分类中的所有书签
  const importedBookmarks = allBookmarks.filter((b) => b.categoryId === importedCategory.id)

  // 添加不重复的书签
  if (!existingCategory.tabs) {
    existingCategory.tabs = []
  }

  importedBookmarks.forEach((bookmark) => {
    const urlLower = bookmark.url.toLowerCase()
    if (!existingUrls.has(urlLower)) {
      // 更新 categoryId 为现有分类的 id
      bookmark.categoryId = existingCategory.id
      existingCategory.tabs.push(bookmark)
      existingUrls.add(urlLower)
      merged++
    } else {
      skipped++
    }
  })

  // 合并子分类
  if (importedCategory.children && importedCategory.children.length > 0) {
    if (!existingCategory.children) {
      existingCategory.children = []
    }

    importedCategory.children.forEach((importedChild) => {
      const childNameLower = importedChild.title.toLowerCase()
      const existingChild = existingCategory.children.find((c) => c.title.toLowerCase() === childNameLower)

      if (existingChild) {
        const stats = mergeCategory(existingChild, importedChild, allBookmarks, existingUrls)
        merged += stats.merged
        skipped += stats.skipped
      } else {
        existingCategory.children.push(importedChild)

        // 统计新子分类中的书签
        const childBookmarks = allBookmarks.filter(
          (b) => b.categoryId === importedChild.id || isInSubCategory(b.categoryId, importedChild)
        )
        merged += childBookmarks.length
      }
    })
  }

  return { merged, skipped }
}

/**
 * 检查书签是否在子分类中
 */
function isInSubCategory(bookmarkCategoryId, category) {
  if (category.id === bookmarkCategoryId) return true

  if (category.children) {
    return category.children.some((child) => isInSubCategory(bookmarkCategoryId, child))
  }

  return false
}
