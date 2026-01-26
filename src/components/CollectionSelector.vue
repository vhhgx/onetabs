<template>
  <Dialog 
    v-model:visible="isVisible" 
    header="选择收藏集" 
    :modal="true"
    :closable="true"
    class="collection-selector-dialog"
    :style="{ width: '600px', maxHeight: '90vh' }"
    @hide="handleClose"
  >
    <div class="selector-content">
      <!-- 搜索框 -->
      <div class="search-box">
        <i class="pi pi-search"></i>
        <InputText 
          v-model="searchQuery" 
          placeholder="搜索收藏集..."
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            @change="toggleSelectAll"
            class="checkbox-input"
          />
          <span>全选 ({{ selectedCollections.length }}/{{ filteredCollections.length }})</span>
        </label>
        <span class="collections-count">共 {{ allCollections.length }} 个收藏集</span>
      </div>

      <!-- 收藏集列表 -->
      <div v-if="filteredCollections.length === 0 && !isLoading" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p v-if="searchQuery">未找到匹配的收藏集</p>
        <p v-else>还没有收藏集</p>
      </div>

      <div v-else-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else class="collections-list">
        <div 
          v-for="collection in filteredCollections" 
          :key="collection.id"
          class="collection-item"
          :class="{ 'collection-selected': isCollectionSelected(collection.id) }"
          @click="toggleCollectionSelection(collection)"
        >
          <input 
            type="checkbox" 
            :checked="isCollectionSelected(collection.id)"
            class="checkbox-input"
            @click.stop
          />
          <div 
            class="collection-color" 
            :style="{ backgroundColor: getColorValue(collection.color) }"
          ></div>
          <div class="collection-info">
            <div class="collection-name">{{ collection.title }}</div>
            <div class="collection-meta">
              <span>{{ collection.tabs.length }} 个标签页</span>
              <span v-if="collection.isPinned" class="pinned-badge">
                <i class="pi pi-bookmark-fill"></i>
                置顶
              </span>
            </div>
          </div>
          <button 
            class="preview-btn"
            @click.stop="togglePreview(collection.id)"
            title="预览标签页"
          >
            <i :class="isPreviewOpen(collection.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          </button>
        </div>

        <!-- 预览标签页 -->
        <transition name="expand">
          <div 
            v-if="isPreviewOpen(collection.id)" 
            class="tabs-preview"
            v-for="collection in filteredCollections.filter(c => isPreviewOpen(c.id))"
            :key="`preview-${collection.id}`"
          >
            <div class="preview-header">标签页列表</div>
            <div class="preview-tabs">
              <div 
                v-for="(tab, index) in collection.tabs" 
                :key="index"
                class="preview-tab"
              >
                <img 
                  v-if="tab.favIconUrl" 
                  :src="tab.favIconUrl" 
                  class="tab-favicon"
                  @error="(e) => e.target.style.display = 'none'"
                />
                <div class="tab-title">{{ tab.title }}</div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button 
          class="btn btn-primary" 
          @click="handleConfirm"
          :disabled="selectedCollections.length === 0"
        >
          确定 ({{ selectedCollections.length }})
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useCollectionsStore } from '../stores/collectionsStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  excludeIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const collectionsStore = useCollectionsStore()

const isVisible = ref(false)
const isLoading = ref(false)
const selectedCollections = ref([])
const searchQuery = ref('')
const previewOpenIds = ref([])

// 所有收藏集（排除已选的）
const allCollections = computed(() => {
  return collectionsStore.collections.filter(c => 
    !props.excludeIds.includes(c.id)
  )
})

// 过滤后的收藏集
const filteredCollections = computed(() => {
  if (!searchQuery.value) return allCollections.value
  
  const query = searchQuery.value.toLowerCase()
  return allCollections.value.filter(collection => 
    collection.title?.toLowerCase().includes(query)
  )
})

// 全选状态
const isAllSelected = computed(() => {
  return filteredCollections.value.length > 0 && 
         selectedCollections.value.length === filteredCollections.value.length
})

const isSomeSelected = computed(() => {
  return selectedCollections.value.length > 0 && 
         selectedCollections.value.length < filteredCollections.value.length
})

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

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal
  if (newVal) {
    loadCollections()
  } else {
    resetState()
  }
})

watch(isVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 加载收藏集
const loadCollections = async () => {
  isLoading.value = true
  try {
    await collectionsStore.loadCollections()
  } catch (error) {
    console.error('加载收藏集失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 收藏集选择
const isCollectionSelected = (collectionId) => {
  return selectedCollections.value.some(c => c.id === collectionId)
}

const toggleCollectionSelection = (collection) => {
  const index = selectedCollections.value.findIndex(c => c.id === collection.id)
  if (index > -1) {
    selectedCollections.value.splice(index, 1)
  } else {
    selectedCollections.value.push(collection)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedCollections.value = []
  } else {
    selectedCollections.value = [...filteredCollections.value]
  }
}

// 预览控制
const isPreviewOpen = (collectionId) => {
  return previewOpenIds.value.includes(collectionId)
}

const togglePreview = (collectionId) => {
  const index = previewOpenIds.value.indexOf(collectionId)
  if (index > -1) {
    previewOpenIds.value.splice(index, 1)
  } else {
    previewOpenIds.value.push(collectionId)
  }
}

// 确认选择
const handleConfirm = () => {
  emit('confirm', selectedCollections.value)
  handleClose()
}

// 关闭对话框
const handleClose = () => {
  isVisible.value = false
}

// 重置状态
const resetState = () => {
  selectedCollections.value = []
  searchQuery.value = ''
  previewOpenIds.value = []
}

// 组件挂载时加载
onMounted(() => {
  if (props.visible) {
    loadCollections()
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

.collections-count {
  font-size: 13px;
  color: #6b7280;
}

/* 收藏集列表 */
.collections-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s;
}

.collection-item:last-child {
  border-bottom: none;
}

.collection-item:hover {
  background: #f9fafb;
}

.collection-item.collection-selected {
  background: #eff6ff;
}

.collection-color {
  width: 12px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.pinned-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
}

.preview-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
}

.preview-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 标签页预览 */
.tabs-preview {
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  padding: 12px 16px;
}

.preview-header {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.preview-tabs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  color: #374151;
}

.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
