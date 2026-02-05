<template>
  <div class="bookmark-search-bar">
    <div class="search-input-wrapper">
      <i class="pi pi-search search-icon"></i>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search-input"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.esc="handleEscape"
        @keydown.enter="handleEnter"
      />
      <button v-if="searchQuery" class="clear-button" @click="clearSearch" title="清除搜索">
        <i class="pi pi-times"></i>
      </button>
      <button
        v-if="showFilterButton"
        class="filter-button"
        :class="{ active: hasActiveFilters }"
        @click="toggleFilters"
        title="高级筛选"
      >
        <i class="pi pi-filter"></i>
      </button>
    </div>

    <!-- 搜索建议下拉 -->
    <transition name="dropdown">
      <div v-if="showSuggestions && (searchQuery || hasActiveFilters)" class="search-suggestions">
        <div v-if="searching" class="suggestions-loading">
          <i class="pi pi-spin pi-spinner"></i>
          <span>搜索中...</span>
        </div>

        <div v-else-if="results.length > 0" class="suggestions-results">
          <div class="results-header">
            <span class="results-count">找到 {{ results.length }} 个结果</span>
            <button v-if="results.length > maxSuggestions" class="view-all-button" @click="handleViewAll">
              查看全部
            </button>
          </div>

          <div class="results-list">
            <div
              v-for="bookmark in displayedResults"
              :key="bookmark.id"
              class="suggestion-item"
              @click="handleResultClick(bookmark)"
            >
              <img :src="getBookmarkIcon(bookmark)" class="bookmark-favicon" @error="handleImageError" />
              <div class="bookmark-info">
                <div class="bookmark-name" v-html="highlightMatch(bookmark.title)"></div>
                <div class="bookmark-url">{{ formatUrl(bookmark.url) }}</div>
                <div v-if="bookmark.categoryPath" class="bookmark-path">
                  <i class="pi pi-folder"></i>
                  <span v-for="(cat, idx) in bookmark.categoryPath" :key="cat.id">
                    {{ cat.title }}<span v-if="idx < bookmark.categoryPath.length - 1"> / </span>
                  </span>
                </div>
              </div>
              <div class="bookmark-actions">
                <button class="action-button" @click.stop="handleQuickOpen(bookmark)" title="在新标签页打开">
                  <i class="pi pi-external-link"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="suggestions-empty">
          <i class="pi pi-search"></i>
          <p>{{ emptyMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- 高级筛选面板 -->
    <transition name="slide-down">
      <div v-if="showFilterPanel" class="filter-panel">
        <div class="filter-section">
          <label class="filter-label">标签筛选</label>
          <div class="tag-chips">
            <Chip
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :class="{ selected: selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            />
          </div>
        </div>

        <div class="filter-section">
          <label class="filter-label">收藏状态</label>
          <div class="filter-options">
            <Checkbox v-model="filters.favoriteOnly" inputId="favoriteOnly" binary />
            <label for="favoriteOnly">仅显示收藏</label>
          </div>
        </div>

        <div class="filter-section">
          <label class="filter-label">固定状态</label>
          <div class="filter-options">
            <Checkbox v-model="filters.pinnedOnly" inputId="pinnedOnly" binary />
            <label for="pinnedOnly">仅显示固定</label>
          </div>
        </div>

        <div class="filter-actions">
          <Button label="清除筛选" text size="small" @click="clearFilters" />
          <Button label="应用" size="small" @click="applyFilters" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBookmarksStore } from '@/stores/bookmarksStore'
import { getTabFaviconSync } from '@/composables/useFavicon'
import Chip from 'primevue/chip'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'

const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索书签名称、URL、标签...',
  },
  showFilterButton: {
    type: Boolean,
    default: true,
  },
  maxSuggestions: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['search', 'select', 'clear'])

const bookmarksStore = useBookmarksStore()
const searchInput = ref(null)
const searchQuery = ref('')
const showSuggestions = ref(false)
const showFilterPanel = ref(false)
const searching = ref(false)
const results = ref([])

const filters = ref({
  favoriteOnly: false,
  pinnedOnly: false,
})
const selectedTags = ref([])

// 计算属性
const displayedResults = computed(() => {
  return results.value.slice(0, props.maxSuggestions)
})

const hasActiveFilters = computed(() => {
  return filters.value.favoriteOnly || filters.value.pinnedOnly || selectedTags.value.length > 0
})

const availableTags = computed(() => {
  // 收集所有唯一标签
  const tags = new Set()
  const collectTags = (categories) => {
    categories.forEach((cat) => {
      if (cat.bookmarks) {
        cat.bookmarks.forEach((b) => {
          if (b.tags) {
            b.tags.forEach((tag) => tags.add(tag))
          }
        })
      }
      if (cat.children) {
        collectTags(cat.children)
      }
    })
  }
  collectTags(bookmarksStore.bookmarks)
  return Array.from(tags).sort()
})

const emptyMessage = computed(() => {
  if (hasActiveFilters.value) {
    return '没有符合筛选条件的书签'
  }
  return searchQuery.value ? '未找到匹配的书签' : '输入关键词开始搜索'
})

// 方法
function handleInput() {
  performSearch()
}

function handleFocus() {
  showSuggestions.value = true
  if (searchQuery.value) {
    performSearch()
  }
}

function handleBlur() {
  // 延迟隐藏，以便点击建议项
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function handleEscape() {
  if (searchQuery.value) {
    clearSearch()
  } else {
    searchInput.value?.blur()
  }
}

function handleEnter() {
  if (results.value.length > 0) {
    handleResultClick(results.value[0])
  }
}

function performSearch() {
  searching.value = true

  // 模拟异步搜索（可以添加防抖）
  setTimeout(() => {
    let searchResults = []

    if (searchQuery.value.trim()) {
      searchResults = bookmarksStore.searchBookmarks(searchQuery.value)
    } else {
      // 无搜索关键词时，根据筛选条件显示
      searchResults = getAllBookmarks()
    }

    // 应用筛选
    if (filters.value.favoriteOnly) {
      searchResults = searchResults.filter((b) => b.isFavorite)
    }
    if (filters.value.pinnedOnly) {
      searchResults = searchResults.filter((b) => b.isPinned)
    }
    if (selectedTags.value.length > 0) {
      searchResults = searchResults.filter((b) => b.tags?.some((tag) => selectedTags.value.includes(tag)))
    }

    results.value = searchResults
    searching.value = false
  }, 100)
}

function getAllBookmarks() {
  const allBookmarks = []
  const collectBookmarks = (categories, path = []) => {
    categories.forEach((cat) => {
      const currentPath = [...path, { id: cat.id, title: cat.title }]
      if (cat.tabs) {
        cat.tabs.forEach((b) => {
          allBookmarks.push({
            ...b,
            categoryPath: currentPath,
          })
        })
      }
      if (cat.children) {
        collectBookmarks(cat.children, currentPath)
      }
    })
  }
  collectBookmarks(bookmarksStore.bookmarks)
  return allBookmarks
}

function clearSearch() {
  searchQuery.value = ''
  results.value = []
  emit('clear')
}

function toggleFilters() {
  showFilterPanel.value = !showFilterPanel.value
}

function toggleTag(tag) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  performSearch()
}

function clearFilters() {
  filters.value.favoriteOnly = false
  filters.value.pinnedOnly = false
  selectedTags.value = []
  performSearch()
}

function applyFilters() {
  performSearch()
  showFilterPanel.value = false
}

function handleResultClick(bookmark) {
  emit('select', bookmark)
  showSuggestions.value = false
}

function handleQuickOpen(bookmark) {
  window.open(bookmark.url, '_blank')
}

function handleViewAll() {
  emit('search', { query: searchQuery.value, results: results.value })
  showSuggestions.value = false
}

function highlightMatch(text) {
  if (!searchQuery.value || !text) return text

  const keyword = searchQuery.value.trim()
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function formatUrl(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + urlObj.pathname
  } catch {
    return url
  }
}

// 获取书签图标
function getBookmarkIcon(bookmark) {
  return getTabFaviconSync(bookmark)
}

function handleImageError(event) {
  event.target.src = '/icons/icon16.png'
}

// 快捷键支持
function handleKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听搜索变化
watch(
  () => [filters.value, selectedTags.value],
  () => {
    if (searchQuery.value || hasActiveFilters.value) {
      performSearch()
    }
  },
  { deep: true }
)

// 暴露方法
defineExpose({
  focus: () => searchInput.value?.focus(),
  clear: clearSearch,
})
</script>

<style scoped>
.bookmark-search-bar {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-alpha);
}

.search-icon {
  color: var(--text-secondary);
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.clear-button,
.filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover,
.filter-button:hover {
  background: var(--surface-100);
  color: var(--text-primary);
}

.filter-button.active {
  color: var(--primary-color);
  background: var(--primary-50);
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow: hidden;
  z-index: 1000;
}

.suggestions-loading,
.suggestions-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--text-secondary);
  gap: 12px;
}

.suggestions-loading i {
  font-size: 24px;
}

.suggestions-empty i {
  font-size: 32px;
}

.suggestions-results {
  display: flex;
  flex-direction: column;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-50);
}

.results-count {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.view-all-button {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.view-all-button:hover {
  background: var(--primary-50);
}

.results-list {
  max-height: 320px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: var(--surface-50);
}

.bookmark-favicon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-name :deep(mark) {
  background: var(--yellow-100);
  color: var(--text-primary);
  padding: 0 2px;
  border-radius: 2px;
}

.bookmark-url {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.bookmark-path {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.bookmark-path i {
  font-size: 10px;
}

.bookmark-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.suggestion-item:hover .bookmark-actions {
  opacity: 1;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: var(--surface-100);
  color: var(--primary-color);
}

.filter-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--surface-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 999;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-section:last-of-type {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chips :deep(.p-chip) {
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chips :deep(.p-chip.selected) {
  background: var(--primary-color);
  color: white;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-options label {
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
