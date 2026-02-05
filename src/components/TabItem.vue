<template>
  <div class="tab-item-wrapper">
    <DraggableTab
      v-if="draggable"
      :tab-data="tab"
      :source-type="sourceType"
      :source-id="sourceId"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
      <div 
        class="tab-item card-hover" 
        @click="handleClick"
        @contextmenu.prevent="handleContextMenu"
      >
        <img :src="tabIcon" alt="icon" class="tab-icon" @error="handleIconError" />
        <div class="tab-info">
          <a class="tab-title">{{ tab.title || '未命名标签页' }}</a>
          <span class="tab-url">{{ formatUrl(tab.url) }}</span>
        </div>
        <div class="tab-actions">
          <button
            class="tab-action-btn btn-press"
            @click.stop="handleOpenTab"
            title="打开标签页"
          >
            <i class="pi pi-external-link"></i>
          </button>
          <div v-if="draggable" class="drag-handle" title="拖拽到收藏集或模板">
            <i class="pi pi-bars"></i>
          </div>
        </div>
      </div>
    </DraggableTab>

    <div 
      v-else 
      class="tab-item card-hover" 
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <img :src="tabIcon" alt="icon" class="tab-icon" @error="handleIconError" />
      <div class="tab-info">
        <span class="tab-title">{{ tab.title || '未命名标签页' }}</span>
        <span class="tab-url">{{ formatUrl(tab.url) }}</span>
      </div>
      <div class="tab-actions">
        <button
          class="tab-action-btn btn-press"
          @click.stop="handleOpenTab"
          title="打开标签页"
        >
          <i class="pi pi-external-link"></i>
        </button>
      </div>
    </div>

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
import { ref, computed, toRef } from 'vue'
import { useToast } from 'primevue/usetoast'
import DraggableTab from './DraggableTab.vue'
import ContextMenu from './ContextMenu.vue'
import { getSessionTabContextMenu } from '../utils/contextMenus'
import { useContextMenu } from '../composables/useContextMenu'
import { getTabFaviconSync } from '../composables/useFavicon'

const props = defineProps({
  tab: {
    type: Object,
    required: true,
  },
  draggable: {
    type: Boolean,
    default: false,
  },
  sourceType: {
    type: String,
    default: 'session',
  },
  sourceId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['click', 'dragstart', 'dragend', 'delete', 'add-to-collection', 'add-to-template'])

const toast = useToast()
const iconError = ref(false)
const { showContextMenu, contextMenuPosition, showMenu } = useContextMenu()

// 标签页图标 - 使用 favicon 缓存
const tabIcon = computed(() => {
  if (iconError.value) {
    return '/icons/icon16.png'
  }
  return getTabFaviconSync(props.tab)
})

// 右键菜单配置
const contextMenuItems = computed(() => {
  return getSessionTabContextMenu(props.tab)
})

// 格式化URL
const formatUrl = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + urlObj.pathname
  } catch {
    return url
  }
}

// 处理图标加载错误
const handleIconError = () => {
  iconError.value = true
}

// 点击标签页
const handleClick = () => {
  emit('click', props.tab.url)
}

// 打开标签页
const handleOpenTab = async () => {
  try {
    await chrome.tabs.create({ url: props.tab.url, active: true })
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '已打开标签页',
      life: 2000
    })
  } catch (error) {
    console.error('打开标签页失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '打开标签页失败',
      life: 3000
    })
  }
}

// 处理右键菜单
const handleContextMenu = (event) => {
  showMenu(event)
}

// 处理菜单操作
const handleMenuAction = async (action) => {
  showContextMenu.value = false

  switch (action.id) {
    case 'open':
      await handleOpenTab()
      break
    case 'copy-url':
      try {
        await navigator.clipboard.writeText(props.tab.url)
        toast.add({
          severity: 'success',
          summary: '成功',
          detail: '已复制链接',
          life: 2000
        })
      } catch (error) {
        console.error('复制失败:', error)
        toast.add({
          severity: 'error',
          summary: '错误',
          detail: '复制失败',
          life: 3000
        })
      }
      break
    case 'add-to-collection':
      emit('add-to-collection', props.tab)
      break
    case 'add-to-template':
      emit('add-to-template', props.tab)
      break
    case 'delete':
      emit('delete', props.tab)
      break
  }
}

// 拖拽事件
const handleDragStart = (dragData) => {
  console.log('TabItem 拖拽开始:', dragData)
  emit('dragstart', dragData)
}

const handleDragEnd = (event) => {
  console.log('TabItem 拖拽结束')
  emit('dragend', event)
}
</script>

<style scoped>
.tab-item-wrapper {
  display: contents;
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
  border: 1px solid transparent;
}

.tab-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.tab-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tab-title {
  font-size: 13px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-url {
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tab-item:hover .tab-actions {
  opacity: 1;
}

.tab-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-action-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  cursor: grab;
  padding: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-item {
    padding: 6px 10px;
  }

  .tab-actions {
    opacity: 1;
  }

  .tab-title {
    font-size: 12px;
  }

  .tab-url {
    font-size: 10px;
  }
}
</style>
