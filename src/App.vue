<template>
  <div class="onetabs-app">
    <header>
      <h1>OneTabs</h1>
      <div class="actions">
        <button @click="saveCurrentTabs" class="save-btn">保存当前标签</button>
      </div>
    </header>
    
    <div class="tab-groups" v-if="tabGroups.length > 0">
      <div class="tab-group" v-for="(group, groupIndex) in tabGroups" :key="groupIndex">
        <div class="group-header">
          <h2>{{ formatDate(group.date) }}</h2>
          <button @click="restoreGroup(groupIndex)" class="restore-btn">恢复所有</button>
          <button @click="deleteGroup(groupIndex)" class="delete-btn">删除组</button>
        </div>
        <ul class="tab-list">
          <li v-for="(tab, tabIndex) in group.tabs" :key="tabIndex" class="tab-item">
            <img :src="tab.favIconUrl || 'icons/default-favicon.png'" alt="icon" class="tab-icon">
            <a :href="tab.url" target="_blank">{{ tab.title }}</a>
            <button @click="deleteTab(groupIndex, tabIndex)" class="delete-tab-btn">×</button>
          </li>
        </ul>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <p>没有保存的标签页组。点击"保存当前标签"按钮保存打开的标签页。</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      tabGroups: []
    }
  },
  mounted() {
    this.loadTabGroups();
  },
  methods: {
    loadTabGroups() {
      chrome.storage.local.get(['tabGroups'], (result) => {
        this.tabGroups = result.tabGroups || [];
      });
    },
    saveCurrentTabs() {
      chrome.runtime.sendMessage({ action: 'saveTabs' });
      // 延迟加载保存的标签组
      setTimeout(() => {
        this.loadTabGroups();
      }, 500);
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN');
    },
    restoreGroup(groupIndex) {
      const group = this.tabGroups[groupIndex];
      group.tabs.forEach(tab => {
        chrome.tabs.create({ url: tab.url });
      });
    },
    deleteGroup(groupIndex) {
      this.tabGroups.splice(groupIndex, 1);
      this.saveTabGroups();
    },
    deleteTab(groupIndex, tabIndex) {
      this.tabGroups[groupIndex].tabs.splice(tabIndex, 1);
      // 如果组中没有标签了，删除整个组
      if (this.tabGroups[groupIndex].tabs.length === 0) {
        this.tabGroups.splice(groupIndex, 1);
      }
      this.saveTabGroups();
    },
    saveTabGroups() {
      chrome.storage.local.set({ tabGroups: this.tabGroups });
    }
  }
}
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

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
  border-bottom: 1px solid #f0f0f0;
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
  color: #1a73e8;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-item a:hover {
  text-decoration: underline;
}

.delete-tab-btn {
  background: none;
  border: none;
  color: #5f6368;
  font-size: 16px;
  padding: 4px 8px;
  cursor: pointer;
}

.delete-tab-btn:hover {
  color: #ea4335;
  background-color: #f1f3f4;
  border-radius: 50%;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  color: #5f6368;
  font-size: 16px;
}
</style>
