// Service Worker for caching favicon images
// 用于缓存书签图标，减少网络请求

const CACHE_NAME = 'onetabs-favicon-cache-v1'
const FAVICON_DOMAINS = [
  'www.google.com',
  't1.gstatic.com',
  't2.gstatic.com',
  't3.gstatic.com'
]

// 判断是否是 favicon 请求
function isFaviconRequest(url) {
  try {
    const urlObj = new URL(url)
    return FAVICON_DOMAINS.some(domain => urlObj.hostname.includes(domain)) &&
           (urlObj.pathname.includes('favicon') || urlObj.pathname.includes('faviconV2'))
  } catch {
    return false
  }
}

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...')
  // 立即激活新的 Service Worker
  self.skipWaiting()
})

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...')
  
  // 清理旧缓存
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  
  // 立即控制所有页面
  return self.clients.claim()
})

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = request.url

  // 只处理 favicon 请求
  if (!isFaviconRequest(url)) {
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 先查缓存
      return cache.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] 从缓存返回图标:', url)
          return cachedResponse
        }

        // 缓存中没有，从网络获取
        console.log('[Service Worker] 从网络获取图标:', url)
        return fetch(request)
          .then((networkResponse) => {
            // 只缓存成功的响应（状态码 200-299）
            if (networkResponse && networkResponse.status >= 200 && networkResponse.status < 300) {
              // 克隆响应，因为响应流只能使用一次
              const responseToCache = networkResponse.clone()
              cache.put(request, responseToCache)
              console.log('[Service Worker] 图标已缓存:', url)
            }
            return networkResponse
          })
          .catch((error) => {
            console.log('[Service Worker] 图标获取失败:', url, error)
            // 返回一个空的 200 响应，防止控制台报错
            // 让 BookmarkCard 的 @error 处理器来显示默认图标
            return new Response('', {
              status: 200,
              statusText: 'OK',
              headers: new Headers({
                'Content-Type': 'image/svg+xml'
              })
            })
          })
      })
    })
  )
})

// 消息处理（用于清除缓存等操作）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_FAVICON_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Service Worker] Favicon 缓存已清除')
        event.ports[0].postMessage({ success: true })
      })
    )
  }
})
