<template>
  <div class="search-bar">
    <div class="search-container">
      <i class="pi pi-search search-icon"></i>
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索会话、收藏集、模板..."
        @input="handleSearch"
        @focus="showResults = true"
        @keydown.esc="handleEscape"
        @keydown.enter="handleEnter"
      />
      <button
        v-if="searchQuery"
        class="clear-btn"
        @click="clearSearch"
        title="清除"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- 搜索结果下拉框 -->
    <transition name="dropdown">
      <div v-if="showResults && searchQuery" class="search-results">
        <div v-if="isSearching" class="results-loading">
          <div class="spinner"></div>
          <span>搜索中...</span>
        </div>

        <div v-else-if="hasResults" class="results-content">
          <!-- 会话结果 -->
          <div v-if="results.sessions.length > 0" class="result-section">
            <div class="section-header">
              <i class="pi pi-clock"></i>
              <span>会话 ({{ results.sessions.length }})</span>
            </div>
            <div
              v-for="item in results.sessions"
              :key="item.id"
              class="result-item"
              @click="handleResultClick('session', item)"
            >
              <div class="item-icon">📦</div>
              <div class="item-content">
                <div class="item-title" v-html="highlightText(item.title)"></div>
                <div class="item-meta">{{ formatTime(item.timestamp) }} • {{ item.tabCount }} 个标签页</div>
              </div>
            </div>
          </div>

          <!-- 收藏集结果 -->
          <div v-if="results.collections.length > 0" class="result-section">
            <div class="section-header">
              <i class="pi pi-folder"></i>
              <span>收藏集 ({{ results.collections.length }})</span>
            </div>
            <div
              v-for="item in results.collections"
              :key="item.id"
              class="result-item"
              @click="handleResultClick('collection', item)"
            >
              <div class="item-color" :style="{ backgroundColor: getColorValue(item.color) }"></div>
              <div class="item-content">
                <div class="item-title" v-html="highlightText(item.name)"></div>
                <div class="item-meta">{{ item.tabs.length }} 个标签页</div>
              </div>
            </div>
          </div>

          <!-- 模板结果 -->
          <div v-if="results.templates.length > 0" class="result-section">
            <div class="section-header">
              <i class="pi pi-window-maximize"></i>
              <span>模板 ({{ results.templates.length }})</span>
            </div>
            <div
              v-for="item in results.templates"
              :key="item.id"
              class="result-item"
              @click="handleResultClick('template', item)"
            >
              <div class="item-icon">🚀</div>
              <div class="item-content">
                <div class="item-title" v-html="highlightText(item.name)"></div>
                <div class="item-meta" v-if="item.description" v-html="highlightText(item.description)"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="results-empty">
          <i class="pi pi-search"></i>
          <p>未找到匹配结果</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionsStore } from '../stores/sessionsStore'
import { useCollectionsStore } from '../stores/collectionsStore'
import { useTemplatesStore } from '../stores/templatesStore'

const router = useRouter()
const sessionsStore = useSessionsStore()
const collectionsStore = useCollectionsStore()
const templatesStore = useTemplatesStore()

const emit = defineEmits(['result-click'])

const searchQuery = ref('')
const showResults = ref(false)
const isSearching = ref(false)
const results = ref({
  sessions: [],
  collections: [],
  templates: []
})

let searchTimeout = null

// 颜色映射
const getColorValue = (color) => {
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
  return colorMap[color] || '#1a73e8'
}

// 是否有结果
const hasResults = computed(() => {
  return results.value.sessions.length > 0 ||
         results.value.collections.length > 0 ||
         results.value.templates.length > 0
})

// 防抖搜索
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    results.value = { sessions: [], collections: [], templates: [] }
    return
  }

  isSearching.value = true

  searchTimeout = setTimeout(() => {
    performSearch()
    isSearching.value = false
  }, 300)
}

// 执行搜索
const performSearch = () => {
  const query = searchQuery.value.toLowerCase().trim()
  
  // 搜索会话
  const sessions = sessionsStore.sessions
    .filter(session => {
      // 搜索标签页标题和 URL
      const hasMatchingTab = [...(session.tabGroups || []), ...(session.ungroupedTabs || [])]
        .flat()
        .some(tab => {
          if (Array.isArray(tab)) {
            return tab.some(t => 
              t.title?.toLowerCase().includes(query) ||
              t.url?.toLowerCase().includes(query)
            )
          }
          return tab.title?.toLowerCase().includes(query) ||
                 tab.url?.toLowerCase().includes(query)
        })
      
      return hasMatchingTab
    })
    .slice(0, 5)
    .map(session => ({
      ...session,
      title: `会话 ${new Date(session.timestamp).toLocaleString()}`,
      tabCount: (session.tabGroups?.length || 0) + (session.ungroupedTabs?.length || 0)
    }))

  // 搜索收藏集
  const collections = collectionsStore.collections
    .filter(collection => {
      const matchName = collection.title?.toLowerCase().includes(query)
      const matchTabs = collection.tabs?.some(tab =>
        tab.title?.toLowerCase().includes(query) ||
        tab.url?.toLowerCase().includes(query)
      )
      return matchName || matchTabs
    })
    .slice(0, 5)

  // 搜索模板
  const templates = templatesStore.templates
    .filter(template => {
      const matchName = template.name?.toLowerCase().includes(query)
      const matchDesc = template.description?.toLowerCase().includes(query)
      return matchName || matchDesc
    })
    .slice(0, 5)

  results.value = {
    sessions,
    collections,
    templates
  }
}

// 高亮匹配文本
const highlightText = (text) => {
  if (!text || !searchQuery.value) return text
  
  const query = searchQuery.value.trim()
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }
  
  return date.toLocaleDateString('zh-CN')
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  results.value = { sessions: [], collections: [], templates: [] }
  showResults.value = false
}

// ESC 键处理
const handleEscape = () => {
  showResults.value = false
}

// Enter 键处理
const handleEnter = () => {
  // 跳转到第一个结果
  if (hasResults.value) {
    if (results.value.sessions.length > 0) {
      handleResultClick('session', results.value.sessions[0])
    } else if (results.value.collections.length > 0) {
      handleResultClick('collection', results.value.collections[0])
    } else if (results.value.templates.length > 0) {
      handleResultClick('template', results.value.templates[0])
    }
  }
}

// 处理结果点击
const handleResultClick = (type, item) => {
  emit('result-click', { type, item })
  
  // 根据类型导航到相应页面
  if (type === 'session') {
    router.push('/')
  } else if (type === 'collection') {
    router.push('/?tab=collections')
  } else if (type === 'template') {
    router.push('/?tab=templates')
  }
  
  showResults.value = false
  
  // 使用 nextTick 确保页面已导航，然后滚动到目标元素
  setTimeout(() => {
    const element = document.querySelector(`[data-id="${item.id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('highlight')
      setTimeout(() => element.classList.remove('highlight'), 2000)
    }
  }, 100)
}

// 点击外部关闭
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const searchBar = document.querySelector('.search-bar')
    if (searchBar && !searchBar.contains(e.target)) {
      showResults.value = false
    }
  })
}
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-btn {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 搜索结果下拉框 */
.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.results-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #6b7280;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-content {
  padding: 8px;
}

.result-section {
  margin-bottom: 12px;
}

.result-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: #f3f4f6;
}

.item-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.item-color {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title :deep(mark) {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
}

.item-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.results-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.results-empty i {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.results-empty p {
  margin: 0;
  font-size: 14px;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* 高亮动画 */
:deep(.highlight) {
  animation: highlight-pulse 2s ease;
}

@keyframes highlight-pulse {
  0%, 100% {
    background: transparent;
  }
  50% {
    background: rgba(59, 130, 246, 0.1);
  }
}
</style>
