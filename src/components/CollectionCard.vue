<template>
  <div class="collection-card">
    <div class="card-header" @click="toggleExpanded">
      <div class="header-left">
        <div class="collection-color" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
        <div class="collection-info">
          <h3 class="collection-name">{{ collection.name }}</h3>
          <span class="collection-meta">{{ collection.tabs.length }} 个标签页</span>
        </div>
        <button class="expand-btn" :class="{ 'expanded': isExpanded }">
          <i class="pi pi-chevron-down"></i>
        </button>
      </div>
      <div class="header-actions" @click.stop>
        <button class="action-btn" @click="handlePin" :title="collection.pinned ? '取消置顶' : '置顶'">
          <i :class="collection.pinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
        </button>
        <button class="action-btn" @click="handleOpen" title="打开">
          <i class="pi pi-external-link"></i>
        </button>
        <button class="action-btn" @click="handleEdit" title="编辑">
          <i class="pi pi-pencil"></i>
        </button>
        <button class="action-btn danger" @click="handleDelete" title="删除">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- 可折叠的标签页列表 -->
    <transition name="expand">
      <div v-if="isExpanded" class="card-body">
        <div class="tabs-list">
          <div 
            v-for="(tab, index) in collection.tabs" 
            :key="index"
            class="tab-item"
            @click="openTab(tab.url)"
          >
            <img 
              v-if="tab.favIconUrl" 
              :src="tab.favIconUrl" 
              class="tab-favicon"
              @error="(e) => e.target.style.display = 'none'"
            />
            <div class="tab-info">
              <div class="tab-title">{{ tab.title }}</div>
              <div class="tab-url">{{ tab.url }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['pin', 'open', 'edit', 'delete'])

const isExpanded = ref(false)

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
  emit('delete', props.collection.id)
}

// 打开单个标签页
const openTab = (url) => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url })
  } else {
    window.open(url, '_blank')
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

.collection-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
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

/* 展开/折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
