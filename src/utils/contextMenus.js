/**
 * 右键菜单配置
 */

// 会话标签页右键菜单
export const getSessionTabContextMenu = (tab) => {
  return [
    {
      id: 'open',
      label: '打开',
      icon: 'pi pi-external-link',
      action: 'open'
    },
    {
      id: 'copy-url',
      label: '复制URL',
      icon: 'pi pi-copy',
      action: 'copy-url'
    },
    {
      divider: true
    },
    {
      id: 'add-to-collection',
      label: '添加到收藏集',
      icon: 'pi pi-folder-plus',
      action: 'add-to-collection'
    },
    {
      id: 'add-to-template',
      label: '添加到模板',
      icon: 'pi pi-plus',
      action: 'add-to-template'
    },
    {
      divider: true
    },
    {
      id: 'delete',
      label: '删除',
      icon: 'pi pi-trash',
      action: 'delete',
      danger: true
    }
  ]
}

// 收藏集右键菜单
export const getCollectionContextMenu = (collection) => {
  return [
    {
      id: 'open-new-window',
      label: '在新窗口打开',
      icon: 'pi pi-window-maximize',
      action: 'open-new-window'
    },
    {
      id: 'open-current-window',
      label: '在当前窗口打开',
      icon: 'pi pi-external-link',
      action: 'open-current-window'
    },
    {
      divider: true
    },
    {
      id: 'edit',
      label: '编辑',
      icon: 'pi pi-pencil',
      action: 'edit'
    },
    {
      id: 'duplicate',
      label: '复制',
      icon: 'pi pi-copy',
      action: 'duplicate'
    },
    {
      divider: true
    },
    {
      id: 'add-to-template',
      label: '添加到模板',
      icon: 'pi pi-plus',
      action: 'add-to-template'
    },
    {
      divider: true
    },
    {
      id: 'delete',
      label: '删除',
      icon: 'pi pi-trash',
      action: 'delete',
      danger: true
    }
  ]
}

// 模板右键菜单
export const getTemplateContextMenu = (template) => {
  return [
    {
      id: 'open',
      label: '打开',
      icon: 'pi pi-external-link',
      action: 'open'
    },
    {
      divider: true
    },
    {
      id: 'edit',
      label: '编辑',
      icon: 'pi pi-pencil',
      action: 'edit'
    },
    {
      id: 'duplicate',
      label: '复制',
      icon: 'pi pi-copy',
      action: 'duplicate'
    },
    {
      divider: true
    },
    {
      id: 'export',
      label: '导出为JSON',
      icon: 'pi pi-download',
      action: 'export'
    },
    {
      divider: true
    },
    {
      id: 'delete',
      label: '删除',
      icon: 'pi pi-trash',
      action: 'delete',
      danger: true
    }
  ]
}

// 会话卡片右键菜单
export const getSessionContextMenu = (session) => {
  return [
    {
      id: 'restore',
      label: '恢复所有标签页',
      icon: 'pi pi-replay',
      action: 'restore'
    },
    {
      id: 'pin',
      label: session.isPinned ? '取消置顶' : '置顶',
      icon: session.isPinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark',
      action: 'toggle-pin'
    },
    {
      divider: true
    },
    {
      id: 'delete',
      label: '删除',
      icon: 'pi pi-trash',
      action: 'delete',
      danger: true
    }
  ]
}
