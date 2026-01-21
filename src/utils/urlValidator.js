/**
 * URL 验证和处理工具函数
 */

/**
 * 验证 URL 是否有效
 * @param {string} url - 要验证的URL
 * @returns {boolean} - 是否有效
 */
export function isValidUrl(url) {
  try {
    const urlObj = new URL(url)
    // 只允许 http 和 https 协议
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 格式化 URL（自动添加协议）
 * @param {string} url - 要格式化的URL
 * @returns {string} - 格式化后的URL
 */
export function formatUrl(url) {
  if (!url) return ''

  // 如果已经有协议，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 自动添加 https://
  return `https://${url}`
}

/**
 * 提取域名
 * @param {string} url - URL
 * @returns {string} - 域名
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
 * 获取网站名称（从域名提取）
 * @param {string} url - URL
 * @returns {string} - 网站名称
 */
export function getSiteName(url) {
  const domain = extractDomain(url)
  if (!domain) return '未知网站'

  // 移除 www. 和顶级域名
  const parts = domain.split('.')
  if (parts[0] === 'www') {
    parts.shift()
  }

  return parts.slice(0, -1).join('.') || domain
}

/**
 * 获取网站图标 URL
 * @param {string} url - 网站URL
 * @param {number} size - 图标大小（默认64）
 * @returns {string} - Favicon URL
 */
export function getFavIconUrl(url, size = 64) {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=${size}`
  } catch {
    return ''
  }
}

/**
 * 检查两个 URL 是否相同（忽略尾部斜杠和协议）
 * @param {string} url1 - URL 1
 * @param {string} url2 - URL 2
 * @returns {boolean} - 是否相同
 */
export function isSameUrl(url1, url2) {
  try {
    const normalize = (url) => {
      const urlObj = new URL(url)
      // 移除尾部斜杠
      const pathname = urlObj.pathname.endsWith('/')
        ? urlObj.pathname.slice(0, -1)
        : urlObj.pathname
      return `${urlObj.hostname}${pathname}${urlObj.search}${urlObj.hash}`
    }

    return normalize(url1) === normalize(url2)
  } catch {
    return false
  }
}
