<template>
  <div 
    class="collection-card card-hover"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="card-header" @click="toggleExpanded">
      <div class="header-left">
        <!-- 展开/折叠图标 -->
        <button class="expand-icon btn-press" :class="{ 'expanded': isExpanded }">
          <i class="pi pi-chevron-right"></i>
        </button>

        <div class="collection-color" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
        
        <div class="collection-info">
          <h3 class="collection-name">{{ collection.name }}</h3>
          <span class="collection-meta">{{ collection.tabs.length }} 个标签页</span>
        </div>
      </div>
      
      <div class="header-actions" @click.stop>
        <button 
          class="action-btn btn-press" 
          @click="handlePin" 
          :title="collection.pinned ? '取消置顶' : '置顶'"
        >
          <i :class="collection.pinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
        </button>
        <button class="action-btn btn-press" @click="handleOpen" title="在新窗口打开">
          <i class="pi pi-external-link"></i>
        </button>
        <button class="action-btn btn-press" @click="handleEdit" title="编辑">
          <i class="pi pi-pencil"></i>
        </button>
        <button class="action-btn danger btn-press" @click="handleDelete" title="删除">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- 可折叠的标签页列表 -->
    <Transition name="expand">
      <div v-show="isExpanded" class="card-body">
        <TransitionGroup name="list" tag="div" class="tabs-list">
          <div 
            v-for="(tab, index) in collection.tabs" 
            :key="tab.id || index"
            class="tab-item card-hover"
            @click="openTab(tab.url)"
          >
            <img 
              v-if="tab.favIconUrl" 
              :src="tab.favIconUrl" 
              class="tab-favicon"
              @error="(e) => e.target.style.display = 'none'"
            />
            <div class="tab-info">
              <div class="tab-title">{{ tab.title || '未命名标签页' }}</div>
              <div class="tab-url">{{ formatUrl(tab.url) }}</div>
            </div>
            <button 
              class="tab-remove-btn btn-press" 
              @click.stop="handleRemoveTab(index)"
              title="从收藏集移除"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Transition>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="showContextMenu"
      v-model:visible="showContextMenu"
      :items="contextMenuItems"
      :position="contextMenuPosition"
      @select="handleMenuAction"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import ContextMenu from './ContextMenu.vue'
import { getCollectionContextMenu } from '../utils/contextMenus'
import { useContextMenu } from '../composables/useContextMenu'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['pin', 'open', 'open-current', 'edit', 'delete', 'duplicate', 'add-to-template', 'remove-tab'])

const confirm = useConfirm()
const toast = useToast()
const isExpanded = ref(false)
const { showContextMenu, contextMenuPosition, showMenu } = useContextMenu()

// 右键菜单配置
const contextMenuItems = computed(() => {
  return getCollectionContextMenu(props.collection)
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

// 切换展开/折叠
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 格式化 URL
const formatUrl = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + urlObj.pathname
  } catch {
    return url
  }
}

// 操作处理
const handlePin = () => {
  emit('pin', props.collection.id)
}

const handleOpen = () => {
  emit('open', props.collection.id)
}

const handleEdit = () => {
  emit('edit', props.collection)
}

const handleDelete = () => {
  confirm.require({
    message: `确定要删除收藏集 "${props.collection.name}" 吗？此操作无法撤销。`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    accept: () => {
      emit('delete', props.collection.id)
    }
  })
}

// 移除标签页
const handleRemoveTab = (index) => {
  emit('remove-tab', props.collection.id, index)
}

// 打开单个标签页
const openTab = (url) => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url })
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '已打开标签页',
      life: 2000
    })
  } else {
    window.open(url, '_blank')
  }
}

// 处理右键菜单
const handleContextMenu = (event) => {
  showMenu(event)
}

// 处理菜单操作
const handleMenuAction = (action) => {
  showContextMenu.value = false

  switch (action.id) {
    case 'open-new':
      emit('open', props.collection.id)
      break
    case 'open-current':
      emit('open-current', props.collection.id)
      break
    case 'edit':
      handleEdit()
      break
    case 'duplicate':
      emit('duplicate', props.collection.id)
      break
    case 'add-to-template':
      emit('add-to-template', props.collection.id)
      break
    case 'delete':
      handleDelete()
      break
  }
}
</script>

<style scoped>
.collection-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
}

.expand-icon:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.expand-icon.expanded {
  transform: rotate(90deg);
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

.expand-btn {
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

.expand-btn i {
  transition: transform 0.2s;
}

.expand-btn.expanded i {
  transform: rotate(180deg);
}

.expand-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-header:hover .header-actions {
  opacity: 1;
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
}

.action-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* 标签页列表 */
.card-body {
  border-top: 1px solid #f3f4f6;
  padding: 12px 20px 20px;
}

.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-item:hover {
  background: #f9fafb;
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
}

.tab-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-url {
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.tab-item:hover .tab-remove-btn {
  opacity: 1;
}

.tab-remove-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    padding: 16px;
  }

  .header-actions {
    opacity: 1;
  }

  .tab-remove-btn {
    opacity: 1;
  }

  .collection-name {
    font-size: 14px;
  }

  .collection-meta {
    font-size: 12px;
  }

  .card-body {
    padding: 12px 16px;
  }
}
</style>.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
