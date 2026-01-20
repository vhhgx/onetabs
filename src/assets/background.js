// 当用户点击插件图标时
chrome.action.onClicked.addListener(async () => {
  await saveTabs()
})

// 监听来自页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveTabs') {
    saveTabs()
  }
  return true
})

// 保存标签页并关闭它们
async function saveTabs() {
  // 获取设置
  let settings = { autoClose: true, keepPinned: false, maxSessions: 50 }
  try {
    const settingsData = await chrome.storage.local.get(['onetabs_settings'])
    if (settingsData.onetabs_settings) {
      settings = { ...settings, ...settingsData.onetabs_settings }
    }
  } catch (error) {
    console.error('读取设置失败:', error)
  }

  console.log('当前设置:', settings)

  // 获取当前窗口
  const currentWindow = await chrome.windows.getCurrent()
  console.log('保存标签页:', currentWindow)

  // 获取当前窗口中的所有标签页
  const allTabs = await chrome.tabs.query({ windowId: currentWindow.id })
  
  // 根据 keepPinned 设置过滤标签页
  let tabs = allTabs
  if (settings.keepPinned) {
    tabs = allTabs.filter(tab => !tab.pinned)
    console.log(`保留 ${allTabs.length - tabs.length} 个固定标签页`)
  }

  // 先检查每个标签所属的分组ID
  let groupedTabsExist = false
  const groupedTabIds = []
  for (const tab of tabs) {
    if (tab.groupId && tab.groupId !== -1) {
      groupedTabsExist = true
      groupedTabIds.push(tab.id)
      console.log('发现分组标签:', tab.title, '分组ID:', tab.groupId)
    }
  }

  // 获取标签页的分组信息
  let tabGroups = []
  if (groupedTabsExist) {
    try {
      tabGroups = await chrome.tabGroups.query({ windowId: currentWindow.id })
      console.log('标签分组信息:', tabGroups)
      // 调试：输出更详细的分组信息
      if (tabGroups.length > 0) {
        tabGroups.forEach((group) => {
          console.log('分组详情:', {
            id: group.id,
            title: group.title,
            color: group.color,
            windowId: group.windowId,
          })
        })
      } else {
        console.log('当前窗口没有标签分组，但有标签的groupId属性。这可能是一个异常情况。')
      }
    } catch (error) {
      console.error('获取标签分组时出错:', error)
    }
  } else {
    console.log('当前窗口没有标签分组')
  }

  // 创建分组映射，用于快速查找
  const groupsMap = {}
  for (const group of tabGroups) {
    groupsMap[group.id] = {
      id: group.id,
      title: group.title || '未命名分组',
      color: group.color,
      collapsed: group.collapsed,
    }
  }

  // 检查是否已经有OneTab页面打开
  const onetabsUrl = chrome.runtime.getURL('index.html')
  let onetabTabId = null

  for (const tab of tabs) {
    if (tab.url.startsWith(onetabsUrl)) {
      onetabTabId = tab.id
      break
    }
  }

  try {
    const data = await chrome.storage.local.get(['tabGroups'])
    // 确保tabGroups是一个数组
    let savedTabGroups = Array.isArray(data.tabGroups) ? data.tabGroups : []

    // 分离置顶组和非置顶组
    const pinnedGroups = savedTabGroups.filter((group) => group.isPinned)
    const unpinnedGroups = savedTabGroups.filter((group) => !group.isPinned)

    // 创建未分组标签的组
    const ungroupedTabsGroup = {
      date: Date.now(),
      type: 'ungrouped',
      tabs: [],
      title: '未分组标签',
      isPinned: false,
    }

    // 收集要保存的标签页（排除OneTab页面）
    for (const tab of tabs) {
      if (tab.url.startsWith(onetabsUrl)) {
        continue // 跳过OneTab页面
      }

      const tabInfo = {
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl || '',
        groupId: tab.groupId,
      }

      // 如果标签属于某个分组
      if (tab.groupId && tab.groupId !== -1 && groupsMap[tab.groupId]) {
        // 这些标签不加入未分组的组
      } else {
        // 未分组的标签
        ungroupedTabsGroup.tabs.push(tabInfo)
      }
    }

    // 如果有未分组标签，保存这个组
    if (ungroupedTabsGroup.tabs.length > 0) {
      unpinnedGroups.unshift(ungroupedTabsGroup)
    }

    // 为每个分组创建单独的标签组
    for (const group of tabGroups) {
      const groupTabs = [];

      const groupTabs = []

      // 查找属于此分组的标签
      for (const tab of tabs) {
        if (tab.url.startsWith(onetabsUrl)) continue

        if (tab.groupId === group.id) {
          groupTabs.push({
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl || '',
            groupId: tab.groupId,
          })
        }
      }

      // 只有当分组中有标签时才保存
      if (groupTabs.length > 0) {
        // 创建分组标签的组
        const groupedTabsGroup = {
          date: Date.now(),
          type: 'grouped',
          groupInfo: {
            id: group.id,
            title: group.title || '未命名分组',
            color: group.color,
            collapsed: group.collapsed,
          },
          tabs: groupTabs,
          title: group.title || '未命名分组',
          isPinned: false,
        }

        unpinnedGroups.unshift(groupedTabsGroup)
      }
    }

    // 合并置顶组和非置顶组
    savedTabGroups = [...pinnedGroups, ...unpinnedGroups]
    
    // 应用 maxSessions 限制（只限制非置顶组）
    if (settings.maxSessions && unpinnedGroups.length > settings.maxSessions) {
      const excessCount = unpinnedGroups.length - settings.maxSessions
      console.log(`超过最大会话数限制 (${settings.maxSessions})，删除最旧的 ${excessCount} 个会话`)
      // 删除最旧的会话（unpinnedGroups 已按时间倒序排列，所以删除末尾的）
      savedTabGroups = [...pinnedGroups, ...unpinnedGroups.slice(0, settings.maxSessions)]
    }

    // 保存所有标签组
    await chrome.storage.local.set({ tabGroups: savedTabGroups })

    // 调试信息，验证保存内容
    console.log('保存的标签组:', savedTabGroups)
  } catch (error) {
    console.error('保存标签时出错:', error)
  }

  // 如果没有OneTab页面，则创建一个
  if (!onetabTabId) {
    await chrome.tabs.create({ url: onetabsUrl })
    // 查找并获取新创建的OneTab标签页ID
    const newTabs = await chrome.tabs.query({ url: onetabsUrl })
    if (newTabs.length > 0) {
      onetabTabId = newTabs[0].id
    }
  } else {
    // 如果已有OneTab页面，刷新它以更新内容
    await chrome.tabs.reload(onetabTabId)
  }

  // 关闭其他标签页（根据设置保留固定标签页）
  for (const tab of allTabs) {
    // 跳过 OneTab 页面
    if (tab.id === onetabTabId) {
      continue
    }
    // 如果设置了保留固定标签页，则跳过固定标签页
    if (settings.keepPinned && tab.pinned) {
      continue
    }
    await chrome.tabs.remove(tab.id)
  }
}
