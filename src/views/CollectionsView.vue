<template>
  <div class="collections-view">
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
      <div v-if="!isLoading && collections.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p class="empty-text">还没有收藏集</p>
        <p class="empty-hint">创建收藏集来组织你常用的网站</p>
        <p class="empty-hint">点击"新建收藏集"按钮开始</p>
      </div>

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
                <div class="collection-color" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
                <div class="collection-info">
                  <h3 class="collection-name">{{ collection.name }}</h3>
                  <span class="collection-meta">{{ collection.tabs.length }} 个标签页</span>
                </div>
              </div>
              <div class="header-actions">
                <button class="action-btn" @click="togglePin(collection.id)" :title="collection.pinned ? '取消置顶' : '置顶'">
                  <i :class="collection.pinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
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

const collectionsStore = useCollectionsStore()
const toast = useToast()
const confirm = useConfirm()

// 状态
const isLoading = computed(() => collectionsStore.isLoading)
const collections = computed(() => collectionsStore.getCollections)
const showEditor = ref(false)
const editingCollection = ref(null)

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
    if (editingCollection.value) {
      // 更新现有收藏集
      await collectionsStore.updateCollection(editingCollection.value.id, data)
    } else {
      // 创建新收藏集
      await collectionsStore.createCollection(data)
    }
    await collectionsStore.loadCollections()
  } catch (error) {
    console.error('保存收藏集失败:', error)
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
      name: '工作常用网站',
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
  try {
    console.log('拖放标签页到收藏集:', dragData.tab.title, '→', targetId)
    
    // 添加标签页到收藏集
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
</script>

<style scoped>
.collections-view {
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
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
</style>
