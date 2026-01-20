<template>
  <Dialog 
    v-model:visible="isVisible" 
    header="选择标签页" 
    :modal="true"
    :closable="true"
    class="tab-selector-dialog"
    :style="{ width: '600px', maxHeight: '90vh' }"
    @hide="handleClose"
  >
    <div class="selector-content">
      <!-- 搜索框 -->
      <div class="search-box">
        <i class="pi pi-search"></i>
        <InputText 
          v-model="searchQuery" 
          placeholder="搜索标签页..."
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- 全选/取消全选 -->
      <div class="toolbar">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            @change="toggleSelectAll"
            class="checkbox-input"
          />
          <span>全选 ({{ selectedTabs.length }}/{{ filteredTabs.length }})</span>
        </label>
        <span class="tabs-count">共 {{ currentWindowTabs.length }} 个标签页</span>
      </div>

      <!-- 标签页列表 -->
      <div v-if="filteredTabs.length === 0 && !isLoading" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p v-if="searchQuery">未找到匹配的标签页</p>
        <p v-else>当前窗口没有标签页</p>
      </div>

      <div v-else-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else class="tabs-list">
        <div 
          v-for="tab in filteredTabs" 
          :key="tab.id"
          class="tab-item"
          :class="{ 'tab-selected': isTabSelected(tab.id) }"
          @click="toggleTabSelection(tab)"
        >
          <input 
            type="checkbox" 
            :checked="isTabSelected(tab.id)"
            class="checkbox-input"
            @click.stop
          />
          <img 
            v-if="tab.favIconUrl" 
            :src="tab.favIconUrl" 
            class="tab-favicon"
            @error="(e) => e.target.style.display = 'none'"
          />
          <div class="tab-info">
            <div class="tab-title">{{ tab.title || '未命名' }}</div>
            <div class="tab-url">{{ tab.url }}</div>
          </div>
          <div v-if="tab.groupId !== -1" class="tab-badge" title="已在标签组中">
            <i class="pi pi-folder"></i>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button 
          class="btn btn-primary" 
          @click="handleConfirm"
          :disabled="selectedTabs.length === 0"
        >
          确定 ({{ selectedTabs.length }})
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  excludeUrls: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const isVisible = ref(false)
const isLoading = ref(false)
const currentWindowTabs = ref([])
const selectedTabs = ref([])
const searchQuery = ref('')

// 过滤后的标签页
const filteredTabs = computed(() => {
  if (!searchQuery.value) return currentWindowTabs.value
  
  const query = searchQuery.value.toLowerCase()
  return currentWindowTabs.value.filter(tab => 
    tab.title?.toLowerCase().includes(query) || 
    tab.url?.toLowerCase().includes(query)
  )
})

// 全选状态
const isAllSelected = computed(() => {
  return filteredTabs.value.length > 0 && 
         selectedTabs.value.length === filteredTabs.value.length
})

const isSomeSelected = computed(() => {
  return selectedTabs.value.length > 0 && 
         selectedTabs.value.length < filteredTabs.value.length
})

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal
  if (newVal) {
    loadCurrentWindowTabs()
  } else {
    resetState()
  }
})

watch(isVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 加载当前窗口标签页
const loadCurrentWindowTabs = async () => {
  isLoading.value = true
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      // 过滤掉 chrome:// 和已排除的 URL
      currentWindowTabs.value = tabs.filter(tab => 
        !tab.url.startsWith('chrome://') &&
        !props.excludeUrls.includes(tab.url)
      )
      console.log('加载标签页:', currentWindowTabs.value.length)
    }
  } catch (error) {
    console.error('加载当前窗口标签页失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 标签页选择
const isTabSelected = (tabId) => {
  return selectedTabs.value.some(t => t.id === tabId)
}

const toggleTabSelection = (tab) => {
  const index = selectedTabs.value.findIndex(t => t.id === tab.id)
  if (index > -1) {
    selectedTabs.value.splice(index, 1)
  } else {
    selectedTabs.value.push(tab)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedTabs.value = []
  } else {
    // 全选当前过滤的标签页
    selectedTabs.value = [...filteredTabs.value]
  }
}

// 确认选择
const handleConfirm = () => {
  const tabsData = selectedTabs.value.map(tab => ({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  }))
  
  emit('confirm', tabsData)
  handleClose()
}

// 关闭对话框
const handleClose = () => {
  isVisible.value = false
}

// 重置状态
const resetState = () => {
  selectedTabs.value = []
  searchQuery.value = ''
  currentWindowTabs.value = []
}

// 组件挂载时加载
onMounted(() => {
  if (props.visible) {
    loadCurrentWindowTabs()
  }
})
</script>

<style scoped>
.selector-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

/* 搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i.pi-search {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
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

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.tabs-count {
  font-size: 13px;
  color: #6b7280;
}

/* 标签页列表 */
.tabs-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item:last-child {
  border-bottom: none;
}

.tab-item:hover {
  background: #f9fafb;
}

.tab-item.tab-selected {
  background: #eff6ff;
}

.tab-favicon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-info {
  flex: 1;
  min-width: 0;
}

.tab-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-url {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.tab-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 4px;
  color: #6b7280;
  font-size: 12px;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
