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

// 书签右键菜单
export const getBookmarkContextMenu = (bookmark) => {
  return [
    {
      id: 'open',
      label: '打开',
      icon: 'pi pi-external-link',
      action: 'open'
    },
    {
      id: 'open-new-tab',
      label: '在新标签页打开',
      icon: 'pi pi-window-maximize',
      action: 'open-new-tab'
    },
    {
      divider: true
    },
    {
      id: 'pin',
      label: bookmark.isPinned ? '取消固定' : '固定',
      icon: 'pi pi-thumbtack',
      action: 'toggle-pin'
    },
    {
      id: 'favorite',
      label: bookmark.isFavorite ? '取消收藏' : '收藏',
      icon: bookmark.isFavorite ? 'pi pi-star-fill' : 'pi pi-star',
      action: 'toggle-favorite'
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
      id: 'copy-url',
      label: '复制链接',
      icon: 'pi pi-link',
      action: 'copy-url'
    },
    {
      divider: true
    },
    {
      id: 'move',
      label: '移动到...',
      icon: 'pi pi-folder-open',
      action: 'move'
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

// 分类右键菜单
export const getCategoryContextMenu = (category, level = 1) => {
  const menu = [
    {
      id: 'edit',
      label: '编辑分类',
      icon: 'pi pi-pencil',
      action: 'edit'
    }
  ]

  // 一级和二级分类可以添加子分类
  if (level === 1 || level === 2) {
    menu.push({
      id: 'add-subcategory',
      label: '添加子分类',
      icon: 'pi pi-plus',
      action: 'add-subcategory'
    })
  }

  menu.push(
    {
      divider: true
    },
    {
      id: 'add-bookmark',
      label: '添加书签',
      icon: 'pi pi-bookmark',
      action: 'add-bookmark'
    },
    {
      divider: true
    },
    {
      id: 'import',
      label: '导入书签',
      icon: 'pi pi-upload',
      action: 'import'
    },
    {
      id: 'export',
      label: '导出分类',
      icon: 'pi pi-download',
      action: 'export'
    },
    {
      divider: true
    },
    {
      id: 'delete',
      label: '删除分类',
      icon: 'pi pi-trash',
      action: 'delete',
      danger: true
    }
  )

  return menu
}

// 固定书签栏右键菜单
export const getPinnedBookmarkContextMenu = (bookmark) => {
  return [
    {
      id: 'open',
      label: '打开',
      icon: 'pi pi-external-link',
      action: 'open'
    },
    {
      id: 'unpin',
      label: '取消固定',
      icon: 'pi pi-thumbtack',
      action: 'unpin'
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
      id: 'copy-url',
      label: '复制链接',
      icon: 'pi pi-link',
      action: 'copy-url'
    }
  ]
}

// 书签批量操作菜单
export const getBookmarkBatchContextMenu = (selectedCount) => {
  return [
    {
      id: 'open-all',
      label: `打开全部 (${selectedCount})`,
      icon: 'pi pi-external-link',
      action: 'open-all'
    },
    {
      divider: true
    },
    {
      id: 'pin-all',
      label: '批量固定',
      icon: 'pi pi-thumbtack',
      action: 'pin-all'
    },
    {
      id: 'favorite-all',
      label: '批量收藏',
      icon: 'pi pi-star',
      action: 'favorite-all'
    },
    {
      divider: true
    },
    {
      id: 'move-all',
      label: '批量移动',
      icon: 'pi pi-folder-open',
      action: 'move-all'
    },
    {
      id: 'export-all',
      label: '导出选中',
      icon: 'pi pi-download',
      action: 'export-all'
    },
    {
      divider: true
    },
    {
      id: 'delete-all',
      label: '批量删除',
      icon: 'pi pi-trash',
      action: 'delete-all',
      danger: true
    }
  ]
}

// 空分类右键菜单
export const getEmptyCategoryContextMenu = () => {
  return [
    {
      id: 'add-bookmark',
      label: '添加书签',
      icon: 'pi pi-bookmark',
      action: 'add-bookmark'
    },
    {
      id: 'add-subcategory',
      label: '添加子分类',
      icon: 'pi pi-plus',
      action: 'add-subcategory'
    },
    {
      divider: true
    },
    {
      id: 'import',
      label: '导入书签',
      icon: 'pi pi-upload',
      action: 'import'
    }
  ]
}

