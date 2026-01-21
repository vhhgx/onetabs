import { onMounted, onUnmounted } from 'vue'

/**
 * 快捷键配置
 */
export const shortcuts = {
  // 保存当前窗口
  SAVE_WINDOW: {
    key: 'ctrl+shift+s',
    mac: 'cmd+shift+s',
    description: '快速保存当前窗口'
  },
  // 打开扩展页面
  OPEN_EXTENSION: {
    key: 'ctrl+shift+o',
    mac: 'cmd+shift+o',
    description: '打开扩展页面'
  },
  // 聚焦搜索框
  FOCUS_SEARCH: {
    key: 'ctrl+f',
    mac: 'cmd+f',
    description: '聚焦搜索框'
  },
  // 关闭弹窗
  CLOSE_DIALOG: {
    key: 'esc',
    description: '关闭弹窗/取消操作'
  },
  // 刷新数据
  REFRESH: {
    key: 'ctrl+r',
    mac: 'cmd+r',
    description: '刷新数据'
  },
  // 切换到会话标签
  TAB_SESSIONS: {
    key: 'ctrl+1',
    mac: 'cmd+1',
    description: '切换到会话标签'
  },
  // 切换到收藏集标签
  TAB_COLLECTIONS: {
    key: 'ctrl+2',
    mac: 'cmd+2',
    description: '切换到收藏集标签'
  },
  // 切换到模板标签
  TAB_TEMPLATES: {
    key: 'ctrl+3',
    mac: 'cmd+3',
    description: '切换到模板标签'
  },
  // 打开设置
  OPEN_SETTINGS: {
    key: 'ctrl+,',
    mac: 'cmd+,',
    description: '打开设置'
  }
}

/**
 * 检测是否是 Mac 系统
 */
const isMac = () => {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

/**
 * 解析快捷键字符串
 */
const parseShortcut = (shortcut) => {
  const keys = shortcut.toLowerCase().split('+')
  return {
    ctrl: keys.includes('ctrl') || keys.includes('cmd'),
    shift: keys.includes('shift'),
    alt: keys.includes('alt'),
    meta: keys.includes('cmd'),
    key: keys[keys.length - 1]
  }
}

/**
 * 检查事件是否匹配快捷键
 */
const matchesShortcut = (event, shortcut) => {
  const parsed = parseShortcut(shortcut)
  
  // 在 Mac 上，Cmd 键映射到 meta，Ctrl 键映射到 ctrl
  const ctrlPressed = isMac() 
    ? (parsed.meta && event.metaKey) || (parsed.ctrl && event.ctrlKey)
    : (parsed.ctrl && event.ctrlKey)
  
  const keyMatches = event.key.toLowerCase() === parsed.key ||
                     event.code.toLowerCase() === parsed.key.toLowerCase()
  
  return ctrlPressed &&
         event.shiftKey === parsed.shift &&
         event.altKey === parsed.alt &&
         keyMatches
}

/**
 * 获取快捷键显示文本
 */
export const getShortcutDisplay = (shortcut) => {
  if (!shortcut) return ''
  
  const key = isMac() ? (shortcut.mac || shortcut.key) : shortcut.key
  
  return key
    .split('+')
    .map(k => {
      const keyMap = {
        'ctrl': isMac() ? '⌃' : 'Ctrl',
        'cmd': '⌘',
        'shift': isMac() ? '⇧' : 'Shift',
        'alt': isMac() ? '⌥' : 'Alt',
        'esc': 'Esc',
        'enter': 'Enter',
        'space': 'Space'
      }
      return keyMap[k.toLowerCase()] || k.toUpperCase()
    })
    .join(isMac() ? '' : '+')
}

/**
 * 快捷键 Composable
 */
export const useShortcuts = (handlers = {}) => {
  const handleKeyDown = (event) => {
    // 如果在输入框中，只处理 ESC 和特定的快捷键
    const isInputElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
    
    // 遍历所有快捷键配置
    for (const [action, config] of Object.entries(shortcuts)) {
      const key = isMac() ? (config.mac || config.key) : config.key
      
      if (matchesShortcut(event, key)) {
        // 如果在输入框中，只允许 ESC 和 Ctrl+F
        if (isInputElement && action !== 'CLOSE_DIALOG' && action !== 'FOCUS_SEARCH') {
          continue
        }
        
        // 如果有对应的处理函数，执行它
        if (handlers[action]) {
          event.preventDefault()
          handlers[action](event)
          return
        }
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    shortcuts,
    getShortcutDisplay
  }
}

/**
 * 注册快捷键处理函数
 */
export const registerShortcut = (action, handler) => {
  const handleKeyDown = (event) => {
    const config = shortcuts[action]
    if (!config) return

    const key = isMac() ? (config.mac || config.key) : config.key
    
    if (matchesShortcut(event, key)) {
      event.preventDefault()
      handler(event)
    }
  }

  document.addEventListener('keydown', handleKeyDown)

  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * 快捷键帮助数据
 */
export const getShortcutHelp = () => {
  return Object.entries(shortcuts).map(([action, config]) => ({
    action,
    shortcut: getShortcutDisplay(config),
    description: config.description
  }))
}
