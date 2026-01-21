import { ref, watch } from 'vue'

// 全局状态：确保同一时间只有一个菜单显示
const globalMenuState = {
  activeMenuId: ref(null),
  closeCallback: null,
}

let menuIdCounter = 0

export function useContextMenu() {
  // 为每个菜单实例生成唯一ID
  const menuId = `menu-${++menuIdCounter}`
  const showContextMenu = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })

  // 显示菜单
  const showMenu = (event) => {
    event.preventDefault()  // 阻止浏览器默认右键菜单
    event.stopPropagation() // 阻止事件冒泡

    // 如果有其他菜单正在显示，先关闭它
    if (globalMenuState.activeMenuId.value && globalMenuState.activeMenuId.value !== menuId) {
      if (globalMenuState.closeCallback) {
        globalMenuState.closeCallback()
      }
    }

    // 设置位置
    contextMenuPosition.value = {
      x: event.clientX,
      y: event.clientY,
    }

    // 显示当前菜单
    showContextMenu.value = true
    globalMenuState.activeMenuId.value = menuId
    globalMenuState.closeCallback = () => {
      showContextMenu.value = false
    }
  }

  // 关闭菜单
  const closeMenu = () => {
    showContextMenu.value = false
    if (globalMenuState.activeMenuId.value === menuId) {
      globalMenuState.activeMenuId.value = null
      globalMenuState.closeCallback = null
    }
  }

  // 监听菜单状态变化
  watch(showContextMenu, (newVal) => {
    if (!newVal && globalMenuState.activeMenuId.value === menuId) {
      globalMenuState.activeMenuId.value = null
      globalMenuState.closeCallback = null
    }
  })

  return {
    showContextMenu,
    contextMenuPosition,
    showMenu,
    closeMenu,
  }
}

