/**
 * Favicon 获取 composable
 *
 * 用于在组件中获取网站图标，支持缓存
 */

import { ref, computed, onMounted } from 'vue'
import {
  getFavicon,
  getFaviconSync,
  extractDomain,
  generateGoogleFaviconUrl,
  preloadFaviconCache
} from '../utils/faviconCache'

// 默认图标
const DEFAULT_ICON = '/icons/icon16.png'

// 全局缓存是否已预加载
let cachePreloaded = false

/**
 * 预加载 favicon 缓存（应用启动时调用一次）
 */
export async function initFaviconCache() {
  if (!cachePreloaded) {
    await preloadFaviconCache()
    cachePreloaded = true
  }
}

/**
 * 获取 tab 的 favicon URL
 * 兼容新旧数据结构
 *
 * @param {Object} tab - tab 数据
 * @returns {string} favicon URL
 */
export function getTabFaviconSync(tab) {
  if (!tab) return DEFAULT_ICON

  // 新数据结构：使用 domain 从缓存获取
  if (tab.domain) {
    return getFaviconSync(tab.domain) || generateGoogleFaviconUrl(tab.domain)
  }

  // 旧数据结构：直接使用 favIconUrl
  if (tab.favIconUrl) {
    return tab.favIconUrl
  }

  // 从 url 提取 domain
  if (tab.url) {
    const domain = extractDomain(tab.url)
    if (domain) {
      return getFaviconSync(domain) || generateGoogleFaviconUrl(domain)
    }
  }

  return DEFAULT_ICON
}

/**
 * 异步获取 tab 的 favicon URL（会触发缓存）
 *
 * @param {Object} tab - tab 数据
 * @returns {Promise<string>} favicon URL
 */
export async function getTabFavicon(tab) {
  if (!tab) return DEFAULT_ICON

  // 新数据结构：使用 domain 从缓存获取
  if (tab.domain) {
    return await getFavicon(tab.domain)
  }

  // 旧数据结构：直接使用 favIconUrl
  if (tab.favIconUrl) {
    return tab.favIconUrl
  }

  // 从 url 提取 domain
  if (tab.url) {
    const domain = extractDomain(tab.url)
    if (domain) {
      return await getFavicon(domain)
    }
  }

  return DEFAULT_ICON
}

/**
 * Favicon composable
 * 用于在组件中响应式地获取 favicon
 *
 * @param {Object} tabRef - tab 数据的 ref 或 computed
 * @returns {Object} { faviconUrl, loading, error, handleError }
 */
export function useFavicon(tabRef) {
  const faviconUrl = ref(DEFAULT_ICON)
  const loading = ref(false)
  const error = ref(false)

  // 计算 domain
  const domain = computed(() => {
    const tab = tabRef.value
    if (!tab) return ''

    if (tab.domain) return tab.domain

    if (tab.url) {
      return extractDomain(tab.url)
    }

    return ''
  })

  // 加载 favicon
  const loadFavicon = async () => {
    const tab = tabRef.value
    if (!tab) {
      faviconUrl.value = DEFAULT_ICON
      return
    }

    error.value = false

    // 先同步获取（快速显示）
    faviconUrl.value = getTabFaviconSync(tab)

    // 再异步获取（确保缓存）
    loading.value = true
    try {
      faviconUrl.value = await getTabFavicon(tab)
    } catch (e) {
      console.error('获取 favicon 失败:', e)
      error.value = true
      faviconUrl.value = DEFAULT_ICON
    } finally {
      loading.value = false
    }
  }

  // 处理图标加载错误
  const handleError = () => {
    error.value = true
    faviconUrl.value = DEFAULT_ICON
  }

  // 组件挂载时加载
  onMounted(loadFavicon)

  return {
    faviconUrl,
    loading,
    error,
    handleError,
    reload: loadFavicon
  }
}

export { extractDomain, generateGoogleFaviconUrl }
