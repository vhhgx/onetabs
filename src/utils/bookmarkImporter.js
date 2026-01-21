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
    bookmarks: []
  }
  
  // 获取根书签文件夹 (通常是 "Bookmarks bar" 或 "Other bookmarks")
  const rootDLs = doc.querySelectorAll('body > dl > dt')
  
  rootDLs.forEach(rootDt => {
    const h3 = rootDt.querySelector('h3')
    if (!h3) return
    
    const rootFolderName = h3.textContent.trim()
    const dl = rootDt.querySelector('dl')
    if (!dl) return
    
    // 创建一级分类
    const firstLevelCategory = {
      id: generateId(),
      name: rootFolderName,
      icon: 'folder',
      color: '#3b82f6',
      children: []
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
  
  dts.forEach(dt => {
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
          name: folderName,
          icon: 'folder',
          color: level === 1 ? '#3b82f6' : '#6366f1',
          children: level === 2 ? [] : undefined
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
      const icon = a.getAttribute('icon')
      
      if (!url || url === '') return
      
      const bookmark = {
        id: generateId(),
        name: name || url,
        url: url,
        description: '',
        favIconUrl: icon || getFavIconUrl(url),
        categoryId: parentCategory.id,
        tags: [],
        isPinned: false,
        isFavorite: false,
        createdAt: addDate ? new Date(parseInt(addDate) * 1000).toISOString() : new Date().toISOString(),
        source: 'chrome'
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
    bookmarks: []
  }
  
  // Chrome书签树的根节点
  const root = tree[0]
  if (!root || !root.children) return result
  
  // 通常包含 "Bookmarks Bar" 和 "Other Bookmarks"
  root.children.forEach(rootNode => {
    if (rootNode.children) {
      const firstLevelCategory = {
        id: generateId(),
        name: rootNode.title || 'Bookmarks',
        icon: 'folder',
        color: '#3b82f6',
        children: []
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
  nodes.forEach(node => {
    if (node.url) {
      // 这是一个书签
      const bookmark = {
        id: generateId(),
        name: node.title || node.url,
        url: node.url,
        description: '',
        favIconUrl: getFavIconUrl(node.url),
        categoryId: parentCategory.id,
        tags: [],
        isPinned: false,
        isFavorite: false,
        createdAt: node.dateAdded ? new Date(node.dateAdded).toISOString() : new Date().toISOString(),
        source: 'chrome'
      }
      
      bookmarks.push(bookmark)
    } else if (node.children) {
      // 这是一个文件夹
      if (level < 3) {
        const childCategory = {
          id: generateId(),
          name: node.title || 'Unnamed',
          icon: 'folder',
          color: level === 1 ? '#3b82f6' : '#6366f1',
          children: level === 2 ? [] : undefined
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
    // 替换模式：直接返回导入的数据
    return {
      bookmarks: importedData.categories,
      mergedCount: importedData.bookmarks.length,
      skippedCount: 0
    }
  }
  
  // 合并模式：将导入的分类和书签合并到现有数据
  const existingUrls = new Set()
  const existingCategoryNames = new Set()
  
  // 收集现有的URL和分类名称
  currentData.bookmarks.forEach(category => {
    existingCategoryNames.add(category.name.toLowerCase())
    collectBookmarkUrls(category, existingUrls)
  })
  
  let mergedCount = 0
  let skippedCount = 0
  
  // 合并分类和书签
  const mergedBookmarks = [...currentData.bookmarks]
  
  importedData.categories.forEach(importedCategory => {
    const categoryNameLower = importedCategory.name.toLowerCase()
    
    // 查找是否有同名分类
    const existingCategory = mergedBookmarks.find(
      cat => cat.name.toLowerCase() === categoryNameLower
    )
    
    if (existingCategory) {
      // 合并到现有分类
      const stats = mergeCategory(existingCategory, importedCategory, importedData.bookmarks, existingUrls)
      mergedCount += stats.merged
      skippedCount += stats.skipped
    } else {
      // 添加新分类
      mergedBookmarks.push(importedCategory)
      
      // 统计新分类中的书签
      const categoryBookmarks = importedData.bookmarks.filter(
        b => b.categoryId === importedCategory.id || isInSubCategory(b.categoryId, importedCategory)
      )
      mergedCount += categoryBookmarks.length
    }
  })
  
  return {
    bookmarks: mergedBookmarks,
    mergedCount,
    skippedCount
  }
}

/**
 * 收集分类及其子分类中的所有书签URL
 */
function collectBookmarkUrls(category, urlSet) {
  if (category.bookmarks) {
    category.bookmarks.forEach(b => urlSet.add(b.url.toLowerCase()))
  }
  if (category.children) {
    category.children.forEach(child => collectBookmarkUrls(child, urlSet))
  }
}

/**
 * 合并分类
 */
function mergeCategory(existingCategory, importedCategory, allBookmarks, existingUrls) {
  let merged = 0
  let skipped = 0
  
  // 获取导入分类中的所有书签
  const importedBookmarks = allBookmarks.filter(
    b => b.categoryId === importedCategory.id
  )
  
  // 添加不重复的书签
  if (!existingCategory.bookmarks) {
    existingCategory.bookmarks = []
  }
  
  importedBookmarks.forEach(bookmark => {
    const urlLower = bookmark.url.toLowerCase()
    if (!existingUrls.has(urlLower)) {
      // 更新 categoryId 为现有分类的 id
      bookmark.categoryId = existingCategory.id
      existingCategory.bookmarks.push(bookmark)
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
    
    importedCategory.children.forEach(importedChild => {
      const childNameLower = importedChild.name.toLowerCase()
      const existingChild = existingCategory.children.find(
        c => c.name.toLowerCase() === childNameLower
      )
      
      if (existingChild) {
        const stats = mergeCategory(existingChild, importedChild, allBookmarks, existingUrls)
        merged += stats.merged
        skipped += stats.skipped
      } else {
        existingCategory.children.push(importedChild)
        
        // 统计新子分类中的书签
        const childBookmarks = allBookmarks.filter(
          b => b.categoryId === importedChild.id || isInSubCategory(b.categoryId, importedChild)
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
    return category.children.some(child => isInSubCategory(bookmarkCategoryId, child))
  }
  
  return false
}
