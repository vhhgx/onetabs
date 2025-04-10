// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')

  // 创建应用容器
  const appContainer = document.createElement('div')
  appContainer.className = 'onetabs-app'

  // 渲染页面
  renderApp(appContainer)
  app.appendChild(appContainer)

  // 加载标签组数据
  loadTabGroups()
})

// 渲染应用界面
function renderApp(container) {
  container.innerHTML = `
    <header>
      <h1>OneTabs</h1>
      <div class="actions">
        <button id="saveCurrentTabs" class="save-btn">保存当前标签</button>
        <button id="resetStorage" class="delete-btn">重置数据</button>
      </div>
    </header>
    
    <div id="tabGroupsContainer" class="tab-groups"></div>
    
    <div id="emptyState" class="empty-state" style="display:none">
      <p>没有保存的标签页组。点击"保存当前标签"按钮保存打开的标签页。</p>
    </div>
  `

  // 添加事件监听器
  container
    .querySelector('#saveCurrentTabs')
    .addEventListener('click', saveCurrentTabs)
  container
    .querySelector('#resetStorage')
    .addEventListener('click', resetStorage)
}

// 加载标签组数据
function loadTabGroups() {
  chrome.storage.local.get(['tabGroups'], (result) => {
    // 确保tabGroups是一个数组
    const tabGroups = Array.isArray(result.tabGroups) ? result.tabGroups : []
    renderTabGroups(tabGroups)
  })
}

// 渲染标签组列表
function renderTabGroups(tabGroups) {
  const tabGroupsContainer = document.getElementById('tabGroupsContainer')
  const emptyState = document.getElementById('emptyState')

  if (tabGroups.length === 0) {
    tabGroupsContainer.innerHTML = ''
    emptyState.style.display = 'block'
    return
  }

  emptyState.style.display = 'none'

  const tabGroupsHtml = tabGroups
    .map((group, groupIndex) => {
      return `
      <div class="tab-group" data-group-index="${groupIndex}">
        <div class="group-header">
          <h2>${formatDate(group.date)}</h2>
          <div>
            <button class="restore-btn" data-action="restore" data-group-index="${groupIndex}">恢复所有</button>
            <button class="delete-btn" data-action="delete-group" data-group-index="${groupIndex}">删除组</button>
          </div>
        </div>
        <ul class="tab-list">
          ${group.tabs
            .map(
              (tab, tabIndex) => `
            <li class="tab-item" data-tab-index="${tabIndex}">
              <img src="${
                tab.favIconUrl || 'icons/default-favicon.png'
              }" alt="icon" class="tab-icon">
              <a href="${tab.url}" target="_blank">${tab.title}</a>
              <button class="delete-tab-btn" data-action="delete-tab" data-group-index="${groupIndex}" data-tab-index="${tabIndex}">×</button>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `
    })
    .join('')

  tabGroupsContainer.innerHTML = tabGroupsHtml

  // 添加事件委托
  tabGroupsContainer.addEventListener('click', handleTabGroupActions)
}

// 处理标签组操作
function handleTabGroupActions(event) {
  const target = event.target

  if (target.tagName === 'BUTTON') {
    const action = target.getAttribute('data-action')
    const groupIndex = parseInt(target.getAttribute('data-group-index'))

    if (action === 'restore') {
      restoreGroup(groupIndex)
    } else if (action === 'delete-group') {
      deleteGroup(groupIndex)
    } else if (action === 'delete-tab') {
      const tabIndex = parseInt(target.getAttribute('data-tab-index'))
      deleteTab(groupIndex, tabIndex)
    }
  }
}

// 保存当前标签
function saveCurrentTabs() {
  chrome.runtime.sendMessage({ action: 'saveTabs' })
  // 延迟加载保存的标签组
  setTimeout(() => {
    loadTabGroups()
  }, 500)
}

// 恢复标签组
function restoreGroup(groupIndex) {
  chrome.storage.local.get(['tabGroups'], (result) => {
    const tabGroups = Array.isArray(result.tabGroups) ? result.tabGroups : []
    const group = tabGroups[groupIndex]

    if (group) {
      group.tabs.forEach((tab) => {
        chrome.tabs.create({ url: tab.url })
      })
    }
  })
}

// 删除标签组
function deleteGroup(groupIndex) {
  chrome.storage.local.get(['tabGroups'], (result) => {
    const tabGroups = Array.isArray(result.tabGroups) ? result.tabGroups : []
    tabGroups.splice(groupIndex, 1)
    chrome.storage.local.set({ tabGroups }, () => {
      loadTabGroups()
    })
  })
}

// 删除单个标签
function deleteTab(groupIndex, tabIndex) {
  chrome.storage.local.get(['tabGroups'], (result) => {
    const tabGroups = Array.isArray(result.tabGroups) ? result.tabGroups : []

    if (tabGroups[groupIndex]) {
      tabGroups[groupIndex].tabs.splice(tabIndex, 1)

      // 如果组中没有标签了，删除整个组
      if (tabGroups[groupIndex].tabs.length === 0) {
        tabGroups.splice(groupIndex, 1)
      }

      chrome.storage.local.set({ tabGroups }, () => {
        loadTabGroups()
      })
    }
  })
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 添加重置存储功能
function resetStorage() {
  if (
    confirm(
      '确定要重置所有保存的标签组数据吗？这将删除所有已保存的标签页信息！'
    )
  ) {
    chrome.storage.local.set({ tabGroups: [] }, () => {
      loadTabGroups()
      alert('数据已重置')
    })
  }
}
