<template>
  <div class="page-container">
    <div class="main-container">
      <div id="左侧滚动条部分" class="tab-groups">2</div>

      <div id="右（中）侧收藏夹" class="collection-groups">
        <div
          style="
            display: flex;
            justify-content: space-between;
            padding-bottom: 20px;
          ">
          <div style="font-size: 64px; font-weight: bold">21:23</div>

          <div class="">
            <InputText type="text" v-model="value" />
          </div>
        </div>

        <div style="flex: 1">
          <div style="height: 160px; background-color: white">固定的滑动区</div>

          <div style="display: flex; padding-bottom: 12px">
            <div
              style="
                font-size: 18px;
                padding: 10px 32px;
                border-bottom: 2px solid #2d9249;
              ">
              标签
            </div>
            <div
              style="
                font-size: 18px;
                padding: 10px 32px;
                border-bottom: 2px solid transparent;
              ">
              标签
            </div>
          </div>

          <div style="display: flex; flex-direction: column">
            <div style="display: flex">
              <div v-for="item in 8">
                <div
                  style="
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                  ">
                  <img
                    src="https://nuxt.com/icon.png"
                    alt=""
                    style="width: 40px; height: 40px" />
                  <div style="font-size: 14px">文字内容</div>
                </div>
              </div>
            </div>

            <div>收藏夹</div>
          </div>
        </div>
      </div>
      <div id="组件区域" style="width: 380px; background-color: #8d9249"></div>
    </div>
    <!-- 左侧 OneTabs 部分 -->
    <!--    <div class="onetabs-container">-->
    <!--      <div class="onetabs-app">-->
    <!--        <header>-->
    <!--          <h1>OneTabs</h1>-->
    <!--          <div class="actions">-->
    <!--            <button class="save-btn" @click="saveCurrentTabs">保存当前标签</button>-->
    <!--            <button class="delete-btn" @click="resetStorage">重置数据</button>-->
    <!--          </div>-->
    <!--        </header>-->

    <!--        <div class="tab-groups">-->
    <!--          <template v-if="tabGroups.length > 0">-->
    <!--            <div-->
    <!--              v-for="(group, groupIndex) in tabGroups"-->
    <!--              :key="groupIndex"-->
    <!--              class="tab-group"-->
    <!--              :data-group-index="groupIndex"-->
    <!--              :class="{'grouped-card': group.type === 'grouped'}">-->
    <!--              <div class="group-header" :style="group.type === 'grouped' ? {backgroundColor: getGroupColorStyle(group.groupInfo.color)} : {}">-->
    <!--                <h2>-->
    <!--                  <span v-if="group.type === 'grouped'" class="grouped-title">{{ group.title }}</span>-->
    <!--                  <span v-else>{{ formatDate(group.date) }}</span>-->
    <!--                </h2>-->
    <!--                <div>-->
    <!--                  <button class="restore-btn" @click="restoreGroup(groupIndex)">-->
    <!--                    恢复所有-->
    <!--                  </button>-->
    <!--                  <button class="restore-groups-btn" @click="restoreWithGroups(groupIndex)" v-if="group.type === 'grouped'">-->
    <!--                    恢复为分组-->
    <!--                  </button>-->
    <!--                  <button class="delete-btn" @click="deleteGroup(groupIndex)">-->
    <!--                    删除组-->
    <!--                  </button>-->
    <!--                </div>-->
    <!--              </div>-->
    <!--              -->
    <!--              <ul class="tab-list">-->
    <!--                <li-->
    <!--                  v-for="(tab, tabIndex) in group.tabs"-->
    <!--                  :key="tabIndex"-->
    <!--                  class="tab-item"-->
    <!--                  :data-tab-index="tabIndex">-->
    <!--                  <img-->
    <!--                    :src="tab.favIconUrl || '/icons/icon16.png'"-->
    <!--                    alt="icon"-->
    <!--                    class="tab-icon" />-->
    <!--                  <a :href="tab.url" target="_blank">{{ tab.title }}</a>-->
    <!--                  <button-->
    <!--                    class="delete-tab-btn"-->
    <!--                    @click="deleteTab(groupIndex, tabIndex)">-->
    <!--                    ×-->
    <!--                  </button>-->
    <!--                </li>-->
    <!--              </ul>-->
    <!--            </div>-->
    <!--          </template>-->
    <!--          <div v-else class="empty-state">-->
    <!--            <p>没有保存的标签页组。点击"保存当前标签"按钮保存打开的标签页。</p>-->
    <!--          </div>-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </div>-->
    <!--    -->
    <!--    &lt;!&ndash; 右侧黄色背景部分 &ndash;&gt;-->
    <!--    <div class="right-panel">-->
    <!--      <h2>title</h2>-->
    <!--    </div>-->
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getTabGroups, saveTabGroups } from '@/utils/chrome-storage'
import InputText from 'primevue/inputtext'

import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const tabGroups = ref([])

onMounted(() => {
  loadTabGroups()
})

// 加载标签组数据
const loadTabGroups = async () => {
  tabGroups.value = await getTabGroups()
  console.log('加载的标签组数据:', tabGroups.value)
}

// 保存当前标签
const saveCurrentTabs = () => {
  console.log('正在请求保存当前标签...')
  chrome.runtime.sendMessage({ action: 'saveTabs' }, (response) => {
    console.log('保存标签响应:', response)
    if (response && response.error) {
      alert(`保存失败: ${response.error}`)
    } else if (response && response.success) {
      console.log('标签页保存成功')
      // 立即重新加载标签组
      loadTabGroups()
    }
  })
}

// 恢复标签组
const restoreGroup = (groupIndex) => {
  const group = tabGroups.value[groupIndex]
  if (group && group.tabs) {
    group.tabs.forEach((tab) => {
      chrome.tabs.create({ url: tab.url })
    })
  }
}

// 恢复为分组标签
const restoreWithGroups = async (groupIndex) => {
  const group = tabGroups.value[groupIndex]
  if (!group || !group.tabs || group.tabs.length === 0) return

  try {
    console.log('准备恢复为分组:', group)
    // 创建一个新窗口
    const newWindow = await chrome.windows.create({ focused: true })

    // 先创建所有标签
    const tabIds = []
    for (const tab of group.tabs) {
      const newTab = await chrome.tabs.create({
        windowId: newWindow.id,
        url: tab.url,
        active: false,
      })
      tabIds.push(newTab.id)
    }

    // 如果有标签，添加到分组
    if (tabIds.length > 0) {
      console.log('创建分组，标签IDs:', tabIds)
      // 添加到一个新分组
      const newGroupId = await chrome.tabs.group({
        tabIds: tabIds,
        createProperties: { windowId: newWindow.id },
      })

      // 设置分组属性
      await chrome.tabGroups.update(newGroupId, {
        title: group.title || '未命名分组',
        color: group.groupInfo ? group.groupInfo.color : 'blue',
      })

      console.log('分组创建成功，ID:', newGroupId)
    }
  } catch (error) {
    console.error('恢复分组失败:', error)
  }
}

// 获取分组颜色样式
const getGroupColorStyle = (color) => {
  const colorMap = {
    grey: '#5f6368',
    blue: '#1a73e8',
    red: '#d93025',
    yellow: '#f9ab00',
    green: '#1e8e3e',
    pink: '#d01884',
    purple: '#a142f4',
    cyan: '#007b83',
    orange: '#fa903e',
  }

  return colorMap[color] || '#5f6368' // 默认灰色
}

// 删除标签组
const deleteGroup = async (groupIndex) => {
  const updatedGroups = [...tabGroups.value]
  updatedGroups.splice(groupIndex, 1)

  await saveTabGroups(updatedGroups)
  tabGroups.value = updatedGroups
}

// 删除单个标签
const deleteTab = async (groupIndex, tabIndex) => {
  const updatedGroups = [...tabGroups.value]

  if (updatedGroups[groupIndex]) {
    updatedGroups[groupIndex].tabs.splice(tabIndex, 1)

    // 如果组中没有标签了，删除整个组
    if (updatedGroups[groupIndex].tabs.length === 0) {
      updatedGroups.splice(groupIndex, 1)
    }

    await saveTabGroups(updatedGroups)
    tabGroups.value = updatedGroups
  }
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 添加重置存储功能
const resetStorage = async () => {
  if (
    confirm(
      '确定要重置所有保存的标签组数据吗？这将删除所有已保存的标签页信息！'
    )
  ) {
    await saveTabGroups([])
    tabGroups.value = []
    alert('数据已重置')
  }
}
</script>

<style scoped lang="scss">
// 响应式布局

//// 小尺寸
//@media (min-width: 750px) and (max-width: 1200px) {
//  .page-container {
//    //grid-template-columns: 1fr;
//    color: #1a73e8;
//  }
//}
//
//// 中等尺寸
//@media (max-width: 1920px) {
//  .page-container {
//    //grid-template-columns: repeat(2, 1fr);
//    color: green;
//  }
//}

.page-container {
  display: flex;
  //width: 1800px;
  //width: 100%;
  //margin: 0 auto;

  // height: calc(100% - 48px);
  height: 100%;
  padding: 24px;

  .main-container {
    display: flex;
    gap: 20px;
    width: 100%;
    height: 100%;

    .tab-groups {
      background-color: #1a73e8;
      width: 340px;
    }

    .collection-groups {
      //background-color: #4285f4;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }
}

//
//.onetabs-container {
//  width: 50%;
//  overflow-y: auto;
//  overflow-x: hidden; /* 防止横向滚动条 */
//  padding: 0;
//  box-sizing: border-box;
//}
//
//.right-panel {
//  width: 50%;
//  background-color: #ffeb3b; /* 黄色背景 */
//  padding: 20px;
//
//  h2 {
//    color: #333;
//    margin-top: 0;
//    font-size: 24px;
//  }
//}
//
///* OneTabs 应用样式 - 去掉宽度限制 */
//.onetabs-app {
//  padding: 20px;
//  box-sizing: border-box;
//}
//
///* 真正的三列瀑布流布局 */
//.tab-groups {
//  display: grid;
//  grid-template-columns: repeat(3, 1fr);
//  gap: 10px;
//  width: 100%;
//  max-width: 100%;
//  box-sizing: border-box;
//  overflow: hidden; /* 防止内容溢出 */
//}
//
//.tab-group {
//  background-color: white;
//  border-radius: 8px;
//  padding: 15px;
//  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
//  box-sizing: border-box;
//  width: 100%;
//  min-width: 0; /* 关键: 防止内容超出 */
//  display: flex;
//  flex-direction: column;
//  height: auto; /* 高度自适应内容 */
//}
//
//.empty-state {
//  grid-column: 1 / -1; /* 空状态占据所有列 */
//  text-align: center;
//  padding: 30px;
//  background-color: white;
//  border-radius: 8px;
//  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
//  margin-bottom: 10px;
//}
//
//header {
//  display: flex;
//  justify-content: space-between;
//  align-items: center;
//  margin-bottom: 20px;
//  padding-bottom: 10px;
//  border-bottom: 1px solid #e0e0e0;
//}
//
//h1 {
//  margin: 0;
//  color: #333;
//}
//
//.actions {
//  display: flex;
//  gap: 10px;
//}
//
//button {
//  cursor: pointer;
//  padding: 8px 16px;
//  border-radius: 4px;
//  border: none;
//  // background-color: #4285f4;
//  color: white;
//  font-weight: 500;
//
//  // &:hover {
//  //   background-color: #3367d6;
//  // }
//}
//
//.delete-btn {
//  background-color: #ea4335;
//
//  &:hover {
//    background-color: #d33426;
//  }
//}
//
//.group-header {
//  display: flex;
//  justify-content: space-between;
//  align-items: center;
//  margin-bottom: 10px;
//
//  h2 {
//    margin: 0;
//    font-size: 18px;
//    color: #333;
//  }
//}
//
//.tab-list {
//  list-style: none;
//  margin: 0;
//  padding: 0;
//}
//
//.tab-item {
//  display: flex;
//  align-items: center;
//  padding: 8px 0;
//  border-bottom: 1px solid #eee;
//
//  &:last-child {
//    border-bottom: none;
//  }
//
//  a {
//    flex: 1;
//    color: #333;
//    text-decoration: none;
//    overflow: hidden;
//    text-overflow: ellipsis;
//    white-space: nowrap;
//
//    &:hover {
//      text-decoration: underline;
//    }
//  }
//}
//
//.tab-icon {
//  width: 16px;
//  height: 16px;
//  margin-right: 10px;
//}
//
//.delete-tab-btn {
//  background: none;
//  border: none;
//  color: #9e9e9e;
//  font-size: 18px;
//  cursor: pointer;
//  padding: 0 8px;
//
//  &:hover {
//    color: #ea4335;
//  }
//}
//
///* 添加分组相关样式 */
//.original-groups {
//  display: flex;
//  gap: 8px;
//  margin: 10px 0;
//  flex-wrap: wrap;
//  align-items: center;
//}
//
//.group-info-box {
//  font-size: 12px;
//  color: #5f6368;
//  padding-right: 5px;
//}
//
//.group-badge {
//  padding: 2px 8px;
//  border-radius: 12px;
//  color: white;
//  font-size: 12px;
//  font-weight: bold;
//}
//
//.restore-groups-btn {
//  background-color: #34a853;
//
//  &:hover {
//    background-color: #2d9249;
//  }
//}
//
///* 分组标签相关样式 */
//.group-tabs-container {
//  margin-bottom: 15px;
//}
//
//.grouped-tabs-section {
//  background-color: #f8f9fa;
//  border-radius: 6px;
//  margin-bottom: 10px;
//  padding: 8px;
//}
//
//.group-header-badge {
//  display: flex;
//  justify-content: space-between;
//  padding: 5px 10px;
//  border-radius: 4px;
//  color: white;
//  font-weight: bold;
//  margin-bottom: 8px;
//}
//
//.group-title {
//  font-size: 14px;
//}
//
//.group-count {
//  font-size: 12px;
//  opacity: 0.8;
//}
//
//.ungrouped-header {
//  font-size: 14px;
//  color: #5f6368;
//  margin: 10px 0;
//  padding-bottom: 5px;
//  border-bottom: 1px solid #eee;
//}
//
///* 分组卡片样式 - 移除黑色标识 */
//.grouped-card {
//  border-radius: 8px;
//
//  .group-header {
//    color: white;
//    border-radius: 4px 4px 0 0;
//  }
//}
//
//.grouped-title {
//  font-weight: bold;
//  font-size: 16px;
//}
//
///* 响应式布局调整 */
//@media (max-width: 1800px) {
//  .tab-groups {
//    grid-template-columns: repeat(2, 1fr);
//  }
//}
//
//@media (max-width: 992px) {
//  .tab-groups {
//    grid-template-columns: 1fr;
//  }
//}
</style>
