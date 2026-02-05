/**
 * Favicon 缓存管理工具
 *
 * 用于缓存网站图标 URL，避免每次都调用 Google Favicon 服务
 * 存储结构：{ domain: favIconUrl }
 */

import { chromeStorageGet, chromeStorageSet } from './chrome-storage'

const CACHE_KEY = 'favicon_cache'
const GOOGLE_FAVICON_URL = 'https://www.google.com/s2/favicons'
const DEFAULT_ICON_SIZE = 64

// 内存缓存，避免频繁读取存储
let memoryCache = null

/**
 * 从 URL 提取域名
 * @param {string} url - 完整 URL
 * @returns {string} 域名
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * 生成 Google Favicon 服务 URL
 * @param {string} domain - 域名
 * @param {number} size - 图标大小
 * @returns {string} Google Favicon URL
 */
export function generateGoogleFaviconUrl(domain, size = DEFAULT_ICON_SIZE) {
  if (!domain) return ''
  return `${GOOGLE_FAVICON_URL}?domain=${domain}&sz=${size}`
}

/**
 * 加载缓存到内存
 * @returns {Promise<Object>} 缓存对象
 */
async function loadCache() {
  if (memoryCache !== null) {
    return memoryCache
  }

  try {
    const result = await chromeStorageGet(CACHE_KEY)
    memoryCache = result[CACHE_KEY] || {}
    return memoryCache
  } catch (error) {
    console.error('加载 favicon 缓存失败:', error)
    memoryCache = {}
    return memoryCache
  }
}

/**
 * 保存缓存到存储
 * @returns {Promise<void>}
 */
async function saveCache() {
  if (memoryCache === null) return

  try {
    await chromeStorageSet(CACHE_KEY, memoryCache)
  } catch (error) {
    console.error('保存 favicon 缓存失败:', error)
  }
}

/**
 * 获取域名的图标 URL
 * @param {string} domain - 域名
 * @returns {Promise<string>} 图标 URL
 */
export async function getFavicon(domain) {
  if (!domain) return ''

  const cache = await loadCache()

  // 缓存命中
  if (cache[domain]) {
    return cache[domain]
  }

  // 缓存未命中，生成 Google Favicon URL 并缓存
  const faviconUrl = generateGoogleFaviconUrl(domain)
  await setFavicon(domain, faviconUrl)

  return faviconUrl
}

/**
 * 同步获取域名的图标 URL（从内存缓存，不触发存储操作）
 * @param {string} domain - 域名
 * @returns {string} 图标 URL 或空字符串
 */
export function getFaviconSync(domain) {
  if (!domain) return ''

  // 如果内存缓存已加载，直接返回
  if (memoryCache !== null && memoryCache[domain]) {
    return memoryCache[domain]
  }

  // 内存缓存未命中，返回 Google Favicon URL（不缓存）
  return generateGoogleFaviconUrl(domain)
}

/**
 * 设置域名的图标 URL
 * @param {string} domain - 域名
 * @param {string} faviconUrl - 图标 URL
 * @returns {Promise<void>}
 */
export async function setFavicon(domain, faviconUrl) {
  if (!domain || !faviconUrl) return

  const cache = await loadCache()

  // 如果已存在相同值，不需要保存
  if (cache[domain] === faviconUrl) return

  cache[domain] = faviconUrl
  await saveCache()
}

/**
 * 批量设置图标缓存
 * @param {Object} faviconMap - { domain: faviconUrl } 映射
 * @returns {Promise<void>}
 */
export async function setFaviconBatch(faviconMap) {
  if (!faviconMap || Object.keys(faviconMap).length === 0) return

  const cache = await loadCache()

  let hasChanges = false
  for (const [domain, faviconUrl] of Object.entries(faviconMap)) {
    if (domain && faviconUrl && cache[domain] !== faviconUrl) {
      cache[domain] = faviconUrl
      hasChanges = true
    }
  }

  if (hasChanges) {
    await saveCache()
  }
}

/**
 * 预加载缓存到内存（用于应用启动时）
 * @returns {Promise<void>}
 */
export async function preloadFaviconCache() {
  await loadCache()
}

/**
 * 清除指定域名的缓存
 * @param {string} domain - 域名
 * @returns {Promise<void>}
 */
export async function removeFavicon(domain) {
  if (!domain) return

  const cache = await loadCache()

  if (cache[domain]) {
    delete cache[domain]
    await saveCache()
  }
}

/**
 * 清除所有缓存
 * @returns {Promise<void>}
 */
export async function clearFaviconCache() {
  memoryCache = {}
  await saveCache()
}

/**
 * 获取缓存统计信息
 * @returns {Promise<Object>} { count: number, domains: string[] }
 */
export async function getFaviconCacheStats() {
  const cache = await loadCache()
  const domains = Object.keys(cache)

  return {
    count: domains.length,
    domains
  }
}

/**
 * 从 tab 数据中提取 domain 并缓存 favIconUrl
 * 用于 background.js 保存标签时调用
 * @param {Object} tab - 标签页数据 { url, favIconUrl }
 * @returns {Promise<string>} 提取的域名
 */
export async function cacheTabFavicon(tab) {
  if (!tab || !tab.url) return ''

  const domain = extractDomain(tab.url)
  if (!domain) return ''

  // 如果 Chrome 提供了 favIconUrl，优先使用
  if (tab.favIconUrl) {
    await setFavicon(domain, tab.favIconUrl)
  }

  return domain
}

/**
 * 批量处理标签页，提取 domain 并缓存图标
 * @param {Array} tabs - 标签页数组
 * @returns {Promise<Object>} { domain: faviconUrl } 映射
 */
export async function cacheTabsFavicons(tabs) {
  if (!tabs || !Array.isArray(tabs)) return {}

  const faviconMap = {}

  for (const tab of tabs) {
    if (!tab || !tab.url) continue

    const domain = extractDomain(tab.url)
    if (!domain) continue

    // 优先使用 Chrome 提供的 favIconUrl
    if (tab.favIconUrl && !faviconMap[domain]) {
      faviconMap[domain] = tab.favIconUrl
    }
  }

  // 批量保存到缓存
  await setFaviconBatch(faviconMap)

  return faviconMap
}
