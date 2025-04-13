// 当用户点击插件图标时
chrome.action.onClicked.addListener(async () => {
  await saveTabs();
});

// 监听来自页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveTabs') {
    saveTabs();
  }
  return true;
});

// 保存标签页并关闭它们
async function saveTabs() {
  // 获取当前窗口
  const currentWindow = await chrome.windows.getCurrent();

  console.log('保存标签页:', currentWindow);
  

  // 获取当前窗口中的所有标签页
  const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
  
  // 检查是否已经有OneTab页面打开
  const onetabsUrl = chrome.runtime.getURL('index.html');
  let onetabTabId = null;
  
  for (const tab of tabs) {
    if (tab.url.startsWith(onetabsUrl)) {
      onetabTabId = tab.id;
      break;
    }
  }
  
  // 创建一个新的标签组
  const tabGroup = {
    date: Date.now(),
    tabs: []
  };
  
  // 收集要保存的标签页（排除OneTab页面）
  for (const tab of tabs) {
    if (tab.url.startsWith(onetabsUrl)) {
      continue; // 跳过OneTab页面
    }
    
    tabGroup.tabs.push({
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl || ''
    });
  }
  
  // 只有当有标签需要保存时才保存
  if (tabGroup.tabs.length > 0) {
    // 保存到存储中
    try {
      const data = await chrome.storage.local.get(['tabGroups']);
      // 确保tabGroups是一个数组
      let tabGroups = Array.isArray(data.tabGroups) ? data.tabGroups : [];
      
      // 添加新的标签组
      tabGroups.unshift(tabGroup);
      await chrome.storage.local.set({ tabGroups });
      
      // 调试信息，验证保存内容
      console.log('保存的标签组:', tabGroups);
    } catch (error) {
      console.error('保存标签时出错:', error);
    }
  }
  
  // 如果没有OneTab页面，则创建一个
  if (!onetabTabId) {
    await chrome.tabs.create({ url: onetabsUrl });
    // 查找并获取新创建的OneTab标签页ID
    const newTabs = await chrome.tabs.query({ url: onetabsUrl });
    if (newTabs.length > 0) {
      onetabTabId = newTabs[0].id;
    }
  } else {
    // 如果已有OneTab页面，刷新它以更新内容
    await chrome.tabs.reload(onetabTabId);
  }
  
  // 关闭其他标签页
  for (const tab of tabs) {
    if (tab.id !== onetabTabId) {
      await chrome.tabs.remove(tab.id);
    }
  }
}
