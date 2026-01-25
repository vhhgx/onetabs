<template>
  <div :class="['session-card card-hover', { pinned: session.isPinned }]">
    <!-- 卡片头部 -->
    <div class="card-header" @click="toggleExpanded" @contextmenu.prevent="handleContextMenu">
      <div class="header-left">
        <!-- 折叠/展开图标 -->
        <!-- <button class="expand-btn btn-press" :class="{ expanded: isExpanded }">
          <i class="pi pi-chevron-right"></i>
        </button> -->

        <!-- 置顶图标 -->
        <button
          v-if="session.isPinned"
          class="pin-indicator"
          @click.stop="$emit('toggle-pin', session.date)"
          title="取消置顶"
        >
          📌
        </button>

        <!-- 标题信息 -->
        <div class="title-info">
          <h3 class="session-title">
            <span
              v-if="session.type === 'grouped'"
              class="group-indicator"
              :style="{ backgroundColor: getGroupColor(session.groupInfo?.color) }"
            ></span>
            <span>{{ session.title || '未分组标签' }}</span>
          </h3>
          <div class="session-meta">
            <span class="session-time">{{ formatTime(session.date) }}</span>
            <span class="session-count">{{ session.tabs?.length || 0 }} 个标签页</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="header-actions">
        <button
          v-if="!session.isPinned"
          class="action-btn pin-btn btn-press"
          @click.stop="$emit('toggle-pin', session.date)"
          title="置顶"
        >
          📌
        </button>
        <button class="action-btn restore-btn btn-press" @click.stop="handleRestore" title="恢复">
          <i class="pi pi-refresh"></i>
        </button>
        <button class="action-btn delete-btn btn-press" @click.stop="handleDelete" title="删除">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- 展开的标签页列表 -->
    <Transition name="expand">
      <div v-show="isExpanded" class="card-body">
        <TransitionGroup name="list" tag="div" class="tabs-list">
          <TabItem
            v-for="(tab, index) in session.tabs"
            :key="tab.id || index"
            :tab="tab"
            :draggable="true"
            source-type="session"
            :source-id="String(session.date)"
            @click="handleTabClick(tab.url)"
            @delete="handleDeleteTab(tab, index)"
            @add-to-collection="handleAddToCollection"
            @add-to-template="handleAddToTemplate"
          />
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
import TabItem from './TabItem.vue'
import ContextMenu from './ContextMenu.vue'
import { getSessionContextMenu } from '../utils/contextMenus'
import { useContextMenu } from '../composables/useContextMenu'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['restore', 'restore-group', 'delete', 'toggle-pin'])

const confirm = useConfirm()
const toast = useToast()

const isExpanded = ref(true)
const { showContextMenu, contextMenuPosition, showMenu } = useContextMenu()

// 右键菜单配置
const contextMenuItems = computed(() => {
  return getSessionContextMenu(props.session)
})

// 切换展开状态
// const toggleExpanded = () => {
//   isExpanded.value = !isExpanded.value
// }

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

// 获取组颜色
const getGroupColor = (color) => {
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
  return colorMap[color] || '#5f6368'
}

// 恢复会话
const handleRestore = () => {
  if (props.session.type === 'grouped') {
    emit('restore-group', props.session.date)
  } else {
    emit('restore', props.session.date)
  }
}

// 删除会话 - 使用 ConfirmDialog
const handleDelete = () => {
  confirm.require({
    message: '确定要删除此会话吗？此操作无法撤销。',
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    accept: () => {
      emit('delete', props.session.date)
    },
  })
}

// 点击标签页
const handleTabClick = (url) => {
  chrome.tabs.create({ url })
}

// 删除单个标签页
const handleDeleteTab = (tab, index) => {
  // 这里应该调用 store 的方法来删除标签
  console.log('删除标签:', tab, index)
}

// 添加到收藏集
const handleAddToCollection = (tab) => {
  console.log('添加到收藏集:', tab)
  toast.add({
    severity: 'info',
    summary: '提示',
    detail: '请选择一个收藏集',
    life: 3000,
  })
}

// 添加到模板
const handleAddToTemplate = (tab) => {
  console.log('添加到模板:', tab)
  toast.add({
    severity: 'info',
    summary: '提示',
    detail: '请选择一个模板',
    life: 3000,
  })
}

// 处理右键菜单
const handleContextMenu = (event) => {
  showMenu(event)
}

// 处理菜单操作
const handleMenuAction = (action) => {
  showContextMenu.value = false

  switch (action.id) {
    case 'restore':
      handleRestore()
      break
    case 'pin':
      emit('toggle-pin', props.session.date)
      break
    case 'unpin':
      emit('toggle-pin', props.session.date)
      break
    case 'delete':
      handleDelete()
      break
  }
}
</script>

<style scoped>
.session-card {
  background: white;
  border-radius: 8px;
  /* border: 1px solid #e5e7eb; */
  overflow: hidden;
  transition: all 0.2s;
}

.session-card.pinned {
  border-color: #3b82f6;
  background: #eff6ff;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.expand-btn {
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

.expand-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.expand-btn.expanded {
  transform: rotate(90deg);
}

.pin-indicator {
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: transform 0.2s;
}

.pin-indicator:hover {
  transform: scale(1.1);
}

.title-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #111827;
}

.group-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.session-time {
  color: #9ca3af;
}

.session-count {
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-weight: 500;
}

/* 操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  /* gap: 4px; */
  /* opacity: 0;
  transition: opacity 0.2s; */
}

/* .card-header:hover .header-actions {
  opacity: 1;
} */

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.pin-btn:hover {
  background: #dbeafe;
  color: #3b82f6;
}

.restore-btn:hover {
  background: #d1fae5;
  color: #10b981;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* 卡片主体 */
.card-body {
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
}

.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    padding: 12px;
  }

  .header-actions {
    opacity: 1;
  }

  .session-title {
    font-size: 14px;
  }

  .session-meta {
    font-size: 12px;
  }

  .card-body {
    padding: 8px 12px;
  }
}
</style>
