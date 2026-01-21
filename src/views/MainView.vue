<template>
  <div class="main-view">
    <!-- Tab导航 -->
    <div class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab内容区 -->
    <div class="tab-content">
      <KeepAlive>
        <component :is="currentComponent" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SessionsView from './SessionsView.vue'
import CollectionsView from './CollectionsView.vue'
import TemplatesView from './TemplatesView.vue'
import BookmarksView from './BookmarksView.vue'

// 当前激活的Tab
const activeTab = ref('sessions')

// Tab配置
const tabs = [
  { key: 'sessions', label: '会话收纳', icon: '📦' },
  { key: 'collections', label: '标签页组', icon: '📁' },
  { key: 'templates', label: '窗口模板', icon: '🚀' },
  { key: 'bookmarks', label: '书签导航', icon: '🔖' },
]

// 根据activeTab动态获取组件
const currentComponent = computed(() => {
  const componentMap = {
    sessions: SessionsView,
    collections: CollectionsView,
    templates: TemplatesView,
    bookmarks: BookmarksView,
  }
  return componentMap[activeTab.value]
})
</script>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
}

.tab-navigation {
  display: flex;
  gap: 4px;
  padding: 12px 24px 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-btn.active {
  background: #f9fafb;
  color: #3b82f6;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  user-select: none;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}
</style>
