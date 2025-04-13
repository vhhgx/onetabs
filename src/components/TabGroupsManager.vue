<template>
  <div class="onetabs-app">
    <header>
      <h1>OneTabs</h1>
      <div class="actions">
        <button class="save-btn" @click="saveCurrentTabs">保存当前标签</button>
        <button class="delete-btn" @click="resetStorage">重置数据</button>
      </div>
    </header>

    <div class="tab-groups">
      <template v-if="tabGroups.length > 0">
        <div
          v-for="(group, groupIndex) in tabGroups"
          :key="groupIndex"
          class="tab-group"
          :data-group-index="groupIndex">
          <div class="group-header">
            <h2>{{ formatDate(group.date) }}</h2>
            <div>
              <button class="restore-btn" @click="restoreGroup(groupIndex)">
                恢复所有
              </button>
              <button class="delete-btn" @click="deleteGroup(groupIndex)">
                删除组
              </button>
            </div>
          </div>
          <ul class="tab-list">
            <li
              v-for="(tab, tabIndex) in group.tabs"
              :key="tabIndex"
              class="tab-item"
              :data-tab-index="tabIndex">
              <img
                :src="tab.favIconUrl || 'icons/default-favicon.png'"
                alt="icon"
                class="tab-icon" />
              <a :href="tab.url" target="_blank">{{ tab.title }}</a>
              <button
                class="delete-tab-btn"
                @click="deleteTab(groupIndex, tabIndex)">
                ×
              </button>
            </li>
          </ul>
        </div>
      </template>
      <div v-else class="empty-state">
        <p>没有保存的标签页组。点击"保存当前标签"按钮保存打开的标签页。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getTabGroups, saveTabGroups } from '../utils/chrome-storage'

const tabGroups = ref([])

onMounted(() => {
  loadTabGroups()
})

// 加载标签组数据
const loadTabGroups = async () => {
  tabGroups.value = await getTabGroups()
}

// 保存当前标签
const saveCurrentTabs = () => {
  chrome.runtime.sendMessage({ action: 'saveTabs' })
  // 延迟加载保存的标签组
  setTimeout(() => {
    this.loadTabGroups()
  }, 500)
}

// 恢复标签组
const restoreGroup = (groupIndex) => {
  const group = tabGroups.value[groupIndex]
  if (group) {
    group.tabs.forEach((tab) => {
      chrome.tabs.create({ url: tab.url })
    })
  }
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
.onetabs-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

h1 {
  margin: 0;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: #4285f4;
  color: white;
  font-weight: 500;
}

button:hover {
  background-color: #3367d6;
}

.delete-btn {
  background-color: #ea4335;
}

.delete-btn:hover {
  background-color: #d33426;
}

.tab-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-group {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.tab-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.tab-item:last-child {
  border-bottom: none;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
}

.tab-item a {
  flex: 1;
  color: #333;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-item a:hover {
  text-decoration: underline;
}

.delete-tab-btn {
  background: none;
  border: none;
  color: #9e9e9e;
  font-size: 18px;
  cursor: pointer;
  padding: 0 8px;
}

.delete-tab-btn:hover {
  color: #ea4335;
}

.empty-state {
  text-align: center;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  color: #5f6368;
  font-size: 16px;
}
</style>
