/**
 * Service Worker 工具函数
 * 用于与 Service Worker 通信
 */

/**
 * 清除 favicon 缓存
 * @returns {Promise<boolean>} 是否成功
 */
export async function clearFaviconCache() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('Service Worker 未激活，无法清除缓存')
    return false
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel()
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        console.log('Favicon 缓存已清除')
        resolve(true)
      } else {
        console.error('清除缓存失败')
        resolve(false)
      }
    }

    navigator.serviceWorker.controller.postMessage(
      { type: 'CLEAR_FAVICON_CACHE' },
      [messageChannel.port2]
    )
  })
}

/**
 * 检查 Service Worker 是否已激活
 * @returns {boolean}
 */
export function isServiceWorkerActive() {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller)
}

/**
 * 获取 Service Worker 注册信息
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function getServiceWorkerRegistration() {
  if (!navigator.serviceWorker) {
    return null
  }
  
  try {
    return await navigator.serviceWorker.ready
  } catch (error) {
    console.error('获取 Service Worker 注册信息失败:', error)
    return null
  }
}
