<template>
  <div :class="['session-card', { pinned: session.isPinned }]">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-left">
        <!-- 置顶图标 -->
        <button v-if="session.isPinned" class="pin-indicator" @click="$emit('toggle-pin', session.date)" title="取消置顶">
          📌
        </button>
        
        <!-- 标题信息 -->
        <div class="title-info">
          <h3 class="session-title">
            <span v-if="session.type === 'grouped'" class="group-indicator" :style="{ backgroundColor: getGroupColor(session.groupInfo?.color) }"></span>
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
        <button v-if="!session.isPinned" class="action-btn pin-btn" @click="$emit('toggle-pin', session.date)" title="置顶">
          📌
        </button>
        <button class="action-btn restore-btn" @click="handleRestore" title="恢复">
          ↻
        </button>
        <button class="action-btn delete-btn" @click="handleDelete" title="删除">
          🗑️
        </button>
        <button class="action-btn expand-btn" @click="expanded = !expanded" :title="expanded ? '收起' : '展开'">
          {{ expanded ? '▼' : '▶' }}
        </button>
      </div>
    </div>

    <!-- 展开的标签页列表 -->
    <transition name="expand">
      <div v-if="expanded" class="card-body">
        <div class="tabs-list">
          <TabItem
            v-for="(tab, index) in session.tabs"
            :key="index"
            :tab="tab"
            :draggable="true"
            source-type="session"
            :source-id="session.date"
            @click="handleTabClick(tab.url)"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import TabItem from './TabItem.vue'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['restore', 'restore-group', 'delete', 'toggle-pin'])

const confirm = useConfirm()
const expanded = ref(false)

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
    }
  })
}

// 点击标签页
const handleTabClick = (url) => {
  chrome.tabs.create({ url })
}
</script>

<style scoped>
.session-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s;
}

.session-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.pin-indicator {
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
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
  gap: 4px;
}

.action-btn {
  border: none;
  background: transparent;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.pin-btn:hover {
  background: #dbeafe;
}

.restore-btn:hover {
  background: #d1fae5;
}

.delete-btn:hover {
  background: #fee2e2;
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

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
