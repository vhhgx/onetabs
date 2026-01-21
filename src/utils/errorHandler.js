import { useToast } from 'primevue/usetoast'

/**
 * 全局错误处理器
 */
class ErrorHandler {
  constructor() {
    this.toast = null
    this.errorLog = []
    this.maxLogSize = 100
  }

  /**
   * 初始化错误处理器
   */
  init(toast) {
    this.toast = toast

    // 全局错误捕获
    window.addEventListener('error', (event) => {
      this.handleError(event.error, '全局错误')
    })

    // Promise 未处理的 rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Promise 错误')
    })

    // Vue 错误处理器会在 App.vue 中单独配置
  }

  /**
   * 处理错误
   */
  handleError(error, context = '未知错误') {
    console.error(`[${context}]`, error)

    // 记录错误日志
    this.logError({
      context,
      message: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })

    // 显示用户友好的错误提示
    const userMessage = this.getUserFriendlyMessage(error, context)
    
    if (this.toast) {
      this.toast.add({
        severity: 'error',
        summary: '操作失败',
        detail: userMessage,
        life: 5000
      })
    }
  }

  /**
   * 处理 Chrome API 错误
   */
  handleChromeAPIError(error, apiName) {
    const message = error?.message || chrome.runtime.lastError?.message || '未知错误'
    
    console.error(`[Chrome API: ${apiName}]`, message)
    
    this.logError({
      context: `Chrome API: ${apiName}`,
      message,
      timestamp: new Date().toISOString()
    })

    if (this.toast) {
      this.toast.add({
        severity: 'error',
        summary: 'Chrome API 错误',
        detail: this.getChromeAPIFriendlyMessage(apiName, message),
        life: 5000
      })
    }
  }

  /**
   * 处理 Storage 错误
   */
  handleStorageError(error, operation) {
    console.error(`[Storage ${operation}]`, error)
    
    this.logError({
      context: `Storage ${operation}`,
      message: error?.message || String(error),
      timestamp: new Date().toISOString()
    })

    if (this.toast) {
      this.toast.add({
        severity: 'error',
        summary: '存储错误',
        detail: operation === 'save' 
          ? '保存数据失败，请检查存储空间是否充足'
          : '读取数据失败，请刷新页面重试',
        life: 5000
      })
    }
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error, url) {
    console.error('[Network Error]', url, error)
    
    this.logError({
      context: 'Network',
      message: `Failed to load: ${url}`,
      error: error?.message,
      timestamp: new Date().toISOString()
    })

    // 网络错误通常不需要显示 Toast（比如 favicon 加载失败）
    // 除非是关键请求
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserFriendlyMessage(error, context) {
    const message = error?.message || String(error)

    // 常见错误的友好提示
    const errorMap = {
      'QuotaExceededError': '存储空间已满，请清理一些数据',
      'NetworkError': '网络连接失败，请检查网络连接',
      'NotFoundError': '找不到请求的资源',
      'SecurityError': '安全限制，无法执行此操作',
      'TimeoutError': '操作超时，请重试'
    }

    // 查找匹配的错误类型
    for (const [key, friendlyMsg] of Object.entries(errorMap)) {
      if (message.includes(key) || error?.name === key) {
        return friendlyMsg
      }
    }

    // 默认提示
    return '操作失败，请重试或联系支持'
  }

  /**
   * 获取 Chrome API 友好错误信息
   */
  getChromeAPIFriendlyMessage(apiName, message) {
    const apiMessages = {
      'tabs': '标签页操作失败',
      'tabGroups': '标签页组操作失败',
      'windows': '窗口操作失败',
      'storage': '存储操作失败'
    }

    const baseMessage = apiMessages[apiName] || 'Chrome API 调用失败'

    // 特殊情况处理
    if (message.includes('No tab with id')) {
      return '标签页不存在或已关闭'
    }
    if (message.includes('No window with id')) {
      return '窗口不存在或已关闭'
    }
    if (message.includes('QUOTA_BYTES')) {
      return '存储空间已满，请清理数据'
    }

    return baseMessage
  }

  /**
   * 记录错误日志
   */
  logError(errorInfo) {
    this.errorLog.push(errorInfo)

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // 可选：持久化日志
    this.saveLogsToStorage()
  }

  /**
   * 保存日志到存储
   */
  async saveLogsToStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          'onetabs_error_logs': this.errorLog.slice(-50) // 只保存最近 50 条
        })
      }
    } catch (error) {
      console.error('Failed to save error logs:', error)
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLogs() {
    return [...this.errorLog]
  }

  /**
   * 清除错误日志
   */
  clearErrorLogs() {
    this.errorLog = []
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('onetabs_error_logs')
    }
  }

  /**
   * 导出错误日志
   */
  exportErrorLogs() {
    const logs = this.getErrorLogs()
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `onetabs-error-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// 创建单例
export const errorHandler = new ErrorHandler()

/**
 * 在 Vue 组件中使用错误处理
 */
export const useErrorHandler = () => {
  const toast = useToast()

  // 确保 errorHandler 已初始化
  if (!errorHandler.toast) {
    errorHandler.init(toast)
  }

  return {
    handleError: (error, context) => errorHandler.handleError(error, context),
    handleChromeAPIError: (error, apiName) => errorHandler.handleChromeAPIError(error, apiName),
    handleStorageError: (error, operation) => errorHandler.handleStorageError(error, operation),
    handleNetworkError: (error, url) => errorHandler.handleNetworkError(error, url),
    getErrorLogs: () => errorHandler.getErrorLogs(),
    clearErrorLogs: () => errorHandler.clearErrorLogs(),
    exportErrorLogs: () => errorHandler.exportErrorLogs()
  }
}

export default errorHandler
