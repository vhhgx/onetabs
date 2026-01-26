<template>
  <div 
    class="collections-view"
    :class="{ 'drag-over-empty': isDragOverEmpty }"
    @dragover="handleGlobalDragOver"
    @dragenter="handleGlobalDragEnter"
    @dragleave="handleGlobalDragLeave"
    @drop="handleGlobalDrop"
  >
    <!-- 全局拖放提示层 -->
    <div v-if="isDragOverEmpty" class="global-drop-overlay">
      <div class="global-drop-indicator">
        <i class="pi pi-plus-circle"></i>
        <span>释放以创建新收藏集</span>
      </div>
    </div>

    <div class="collections-container">
      <!-- 顶部操作栏 -->
      <div class="collections-header">
        <h2 class="header-title">收藏集</h2>
        <div class="header-actions">
          <button class="btn btn-primary" @click="openCreateDialog" :disabled="isLoading">
            <i class="pi pi-plus"></i>
            <span>新建收藏集</span>
          </button>
          <button class="btn btn-secondary" @click="addMockCollection" :disabled="isLoading">
            <i class="pi pi-code"></i>
            <span>添加测试数据</span>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-if="!isLoading && collections.length === 0"
        icon="pi pi-folder"
        title="还没有收藏集"
        description="创建收藏集来组织你常用的网站，方便快速访问。也可以从左侧拖拽会话到这里创建。"
      >
        <template #icon>
          <div style="font-size: 64px;">📁</div>
        </template>
        <template #action>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" @click="openCreateDialog">
              <i class="pi pi-plus"></i>
              <span>新建收藏集</span>
            </button>
            <button class="btn btn-secondary" @click="addMockCollection">
              <i class="pi pi-code"></i>
              <span>添加测试数据</span>
            </button>
          </div>
        </template>
      </EmptyState>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 收藏集列表 -->
      <div v-else-if="collections.length > 0" class="collections-list">
        <DropZone
          v-for="collection in collections" 
          :key="collection.id"
          target-type="collection"
          :target-id="collection.id"
          :accept-from="['session']"
          @drop="handleDropToCollection"
        >
          <div class="collection-card">
            <div class="card-header">
              <div class="header-left">
                <div class="collection-icon">
                  {{ collection.icon || '📚' }}
                </div>
                <div class="collection-color" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
                <div class="collection-info">
                  <h3 class="collection-name">{{ collection.title }}</h3>
                  <span class="collection-meta">{{ collection.tabs.length }} 个标签页</span>
                </div>
              </div>
              <div class="header-actions">
                <button class="action-btn" @click="togglePin(collection.id)" :title="collection.isPinned ? '取消置顶' : '置顶'">
                  <i :class="collection.isPinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
                </button>
                <button class="action-btn" @click="openCollection(collection.id)" title="打开">
                  <i class="pi pi-external-link"></i>
                </button>
                <button class="action-btn" @click="editCollection(collection)" title="编辑">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn danger" @click="deleteCollection(collection.id)" title="删除">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
            
            <!-- 标签页列表 -->
            <div v-if="collection.tabs && collection.tabs.length > 0" class="tabs-list">
              <div 
                v-for="(tab, index) in collection.tabs" 
                :key="index"
                class="tab-item"
                @click="openSingleTab(tab.url)"
              >
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
              </div>
            </div>
          </div>
        </DropZone>
      </div>
    </div>

    <!-- 收藏集编辑器 -->
    <CollectionEditor 
      v-model:visible="showEditor"
      :collection="editingCollection"
      @save="handleSaveCollection"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import CollectionEditor from '@/components/CollectionEditor.vue'
import DropZone from '@/components/DropZone.vue'
import EmptyState from '@/components/EmptyState.vue'

const collectionsStore = useCollectionsStore()
const toast = useToast()
const confirm = useConfirm()

// 状态
const isLoading = computed(() => collectionsStore.isLoading)
const collections = computed(() => collectionsStore.getCollections)
const showEditor = ref(false)
const editingCollection = ref(null)

// 拖放相关状态
const isDragOverEmpty = ref(false)
const dragEnterCounter = ref(0) // 用于追踪进入/离开事件

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

// 页面挂载时加载数据
onMounted(async () => {
  console.log('CollectionsView 挂载，开始加载数据')
  await collectionsStore.loadCollections()
  console.log('收藏集数据加载完成，数量:', collections.value.length)
})

// 打开创建对话框
const openCreateDialog = () => {
  editingCollection.value = null
  showEditor.value = true
}

// 编辑收藏集
const editCollection = (collection) => {
  editingCollection.value = collection
  showEditor.value = true
}

// 保存收藏集
const handleSaveCollection = async (data) => {
  try {
    console.log('开始保存收藏集:', data)
    if (editingCollection.value) {
      // 更新现有收藏集
      await collectionsStore.updateCollection(editingCollection.value.id, data)
      console.log('收藏集更新完成')
    } else {
      // 创建新收藏集
      const newCollection = await collectionsStore.createCollection(data)
      console.log('收藏集创建完成:', newCollection)
    }
    // 强制重新加载数据
    console.log('重新加载收藏集数据...')
    await collectionsStore.loadCollections()
    console.log('收藏集数据加载完成，当前数量:', collectionsStore.collections.length)
  } catch (error) {
    console.error('保存收藏集失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: error.message || '无法保存收藏集',
      life: 3000
    })
    throw error
  }
}

// 打开收藏集
const openCollection = async (id) => {
  try {
    await collectionsStore.openCollection(id, {
      inNewWindow: false,
      createTabGroup: true,
      inBackground: false
    })
    toast.add({
      severity: 'success',
      summary: '打开成功',
      detail: '收藏集已在当前窗口打开',
      life: 3000
    })
  } catch (error) {
    console.error('打开收藏集失败:', error)
    toast.add({
      severity: 'error',
      summary: '打开失败',
      detail: error.message || '无法打开收藏集',
      life: 3000
    })
  }
}

// 打开单个标签页
const openSingleTab = async (url) => {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      await chrome.tabs.create({ url, active: false })
      toast.add({
        severity: 'success',
        summary: '已在后台打开',
        detail: '',
        life: 2000
      })
    } else {
      window.open(url, '_blank')
    }
  } catch (error) {
    console.error('打开标签页失败:', error)
    toast.add({
      severity: 'error',
      summary: '打开失败',
      detail: error.message,
      life: 3000
    })
  }
}

// 删除收藏集
const deleteCollection = (id) => {
  confirm.require({
    message: '确定要删除这个收藏集吗？此操作无法撤销。',
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    accept: async () => {
      try {
        await collectionsStore.deleteCollection(id)
        toast.add({
          severity: 'success',
          summary: '删除成功',
          detail: '收藏集已删除',
          life: 3000
        })
      } catch (error) {
        console.error('删除收藏集失败:', error)
        toast.add({
          severity: 'error',
          summary: '删除失败',
          detail: error.message || '无法删除收藏集',
          life: 3000
        })
      }
    }
  })
}

// 切换置顶
const togglePin = async (id) => {
  try {
    const pinned = await collectionsStore.togglePin(id)
    toast.add({
      severity: 'success',
      summary: pinned ? '已置顶' : '已取消置顶',
      detail: '',
      life: 2000
    })
  } catch (error) {
    console.error('切换置顶失败:', error)
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message || '无法切换置顶状态',
      life: 3000
    })
  }
}

// 添加测试数据
const addMockCollection = async () => {
  try {
    const mockData = {
      title: '工作常用网站',
      color: ['blue', 'green', 'purple', 'orange'][Math.floor(Math.random() * 4)],
      tabs: [
        {
          title: 'GitHub',
          url: 'https://github.com',
          favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg'
        },
        {
          title: 'Stack Overflow',
          url: 'https://stackoverflow.com',
          favIconUrl: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico'
        },
        {
          title: 'MDN Web Docs',
          url: 'https://developer.mozilla.org',
          favIconUrl: 'https://developer.mozilla.org/favicon-48x48.png'
        }
      ]
    }
    
    await collectionsStore.createCollection(mockData)
    await collectionsStore.loadCollections()
    
    toast.add({
      severity: 'success',
      summary: '添加成功',
      detail: '已添加测试收藏集',
      life: 3000
    })
  } catch (error) {
    console.error('添加测试数据失败:', error)
    toast.add({
      severity: 'error',
      summary: '添加失败',
      detail: error.message || '无法添加测试数据',
      life: 3000
    })
  }
}

// 处理拖放到收藏集
const handleDropToCollection = async ({ dragData, targetId }) => {
  // 阻止全局拖放处理
  isDragOverEmpty.value = false
  dragEnterCounter.value = 0
  
  try {
    // 检查是否是整个会话的拖放
    if (dragData.type === 'session' && dragData.session) {
      console.log('拖放整个会话到收藏集:', dragData.session.title, '→', targetId)
      
      // 将会话的所有标签页添加到收藏集
      for (const tab of dragData.session.tabs) {
        await collectionsStore.addTab(targetId, {
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl || ''
        })
      }
      
      await collectionsStore.loadCollections()
      
      toast.add({
        severity: 'success',
        summary: '添加成功',
        detail: `"${dragData.session.title}" 的 ${dragData.session.tabs.length} 个标签页已添加到收藏集`,
        life: 3000
      })
    } else if (dragData.tab) {
      console.log('拖放标签页到收藏集:', dragData.tab.title, '→', targetId)
      
      // 添加单个标签页到收藏集
      await collectionsStore.addTab(targetId, {
        title: dragData.tab.title,
        url: dragData.tab.url,
        favIconUrl: dragData.tab.favIconUrl || ''
      })
      
      await collectionsStore.loadCollections()
      
      toast.add({
        severity: 'success',
        summary: '添加成功',
        detail: `"${dragData.tab.title}" 已添加到收藏集`,
        life: 3000
      })
    }
  } catch (error) {
    console.error('拖放到收藏集失败:', error)
    toast.add({
      severity: 'error',
      summary: '添加失败',
      detail: error.message || '无法添加标签页',
      life: 3000
    })
  }
}

// 全局拖放处理 - 用于在空白区域创建新收藏集
const handleGlobalDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

const handleGlobalDragEnter = (event) => {
  event.preventDefault()
  dragEnterCounter.value++
  
  // 检查是否是有效的拖放源
  try {
    // 注意：dragenter 时无法获取 getData，只能通过 types 判断
    if (event.dataTransfer.types.includes('application/json')) {
      isDragOverEmpty.value = true
    }
  } catch (error) {
    console.warn('解析拖放数据失败:', error)
  }
}

const handleGlobalDragLeave = (event) => {
  dragEnterCounter.value--
  
  // 只有完全离开才重置状态
  if (dragEnterCounter.value <= 0) {
    isDragOverEmpty.value = false
    dragEnterCounter.value = 0
  }
}

const handleGlobalDrop = async (event) => {
  event.preventDefault()
  
  // 重置状态
  isDragOverEmpty.value = false
  dragEnterCounter.value = 0
  
  // 检查是否落在某个 DropZone 内部（如果是，让 DropZone 处理）
  const dropZone = event.target.closest('.drop-zone')
  if (dropZone) {
    console.log('拖放到 DropZone 内，由 DropZone 处理')
    return
  }
  
  try {
    const jsonData = event.dataTransfer.getData('application/json')
    if (!jsonData) {
      console.warn('没有有效的拖放数据')
      return
    }
    
    const dragData = JSON.parse(jsonData)
    console.log('全局拖放数据:', dragData)
    
    // 检查是否是整个会话的拖放
    if (dragData.type === 'session' && dragData.session) {
      await createCollectionFromSession(dragData.session)
    } else if (dragData.tab) {
      // 单个标签页 - 也创建新收藏集
      await createCollectionFromTab(dragData.tab)
    }
  } catch (error) {
    console.error('处理全局拖放失败:', error)
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message || '无法创建收藏集',
      life: 3000
    })
  }
}

// 从会话创建新收藏集
const createCollectionFromSession = async (session) => {
  try {
    const newCollection = {
      title: session.title || `来自会话 ${new Date(session.date).toLocaleString('zh-CN')}`,
      color: session.groupInfo?.color || 'blue',
      tabs: session.tabs.map(tab => ({
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl || ''
      }))
    }
    
    await collectionsStore.createCollection(newCollection)
    await collectionsStore.loadCollections()
    
    toast.add({
      severity: 'success',
      summary: '创建成功',
      detail: `已从会话创建收藏集 "${newCollection.title}"，包含 ${session.tabs.length} 个标签页`,
      life: 3000
    })
  } catch (error) {
    console.error('从会话创建收藏集失败:', error)
    throw error
  }
}

// 从单个标签页创建新收藏集
const createCollectionFromTab = async (tab) => {
  try {
    const newCollection = {
      title: tab.title || '新收藏集',
      color: 'blue',
      tabs: [{
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl || ''
      }]
    }
    
    await collectionsStore.createCollection(newCollection)
    await collectionsStore.loadCollections()
    
    toast.add({
      severity: 'success',
      summary: '创建成功',
      detail: `已创建收藏集 "${newCollection.title}"`,
      life: 3000
    })
  } catch (error) {
    console.error('从标签页创建收藏集失败:', error)
    throw error
  }
}
</script>

<style scoped>
.collections-view {
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
  position: relative;
}

/* 全局拖放时的样式 */
.collections-view.drag-over-empty {
  background: rgba(59, 130, 246, 0.05);
}

.collections-view.drag-over-empty::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 2px dashed #3b82f6;
  border-radius: 12px;
  pointer-events: none;
  z-index: 5;
}

/* 全局拖放提示层 */
.global-drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  z-index: 10;
  pointer-events: none;
}

.global-drop-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 48px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.global-drop-indicator i {
  font-size: 48px;
  color: #3b82f6;
}

.global-drop-indicator span {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

.collections-container {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

/* 顶部操作栏 */
.collections-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #6b7280;
}

.empty-hint {
  font-size: 14px;
  margin: 4px 0;
  color: #9ca3af;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
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

/* 收藏集列表 */
.collections-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding-bottom: 24px;
}

.collection-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  transition: all 0.2s;
}

.collection-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.collection-color {
  width: 12px;
  height: 48px;
  border-radius: 6px;
  flex-shrink: 0;
}

.collection-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  opacity: 0.8;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-meta {
  font-size: 13px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
}

.action-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.action-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* 标签列表 */
.tabs-list {
  margin-top: 16px;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.tab-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.tab-url {
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
