<template>
  <DraggableTab
    v-if="draggable"
    :tab-data="tab"
    :source-type="sourceType"
    :source-id="sourceId"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="tab-item" @click="handleClick">
      <img :src="tabIcon" alt="icon" class="tab-icon" @error="handleIconError" />
      <div class="tab-info">
        <a class="tab-title">{{ tab.title }}</a>
        <!-- {{ tab.url }}
        <span class="tab-url">{{ formatUrl(tab.url) }}</span> -->
      </div>
      <div v-if="draggable" class="drag-handle" title="拖拽到收藏集或模板">
        <i class="pi pi-bars"></i>
      </div>
    </div>
  </DraggableTab>

  <div v-else class="tab-item" @click="handleClick">
    <img :src="tabIcon" alt="icon" class="tab-icon" @error="handleIconError" />
    <div class="tab-info">
      <span class="tab-title">{{ tab.title }}</span>
      <span class="tab-url">{{ formatUrl(tab.url) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DraggableTab from './DraggableTab.vue'

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

const emit = defineEmits(['click', 'dragstart', 'dragend'])

const iconError = ref(false)

// 标签页图标
const tabIcon = computed(() => {
  if (iconError.value || !props.tab.favIconUrl) {
    return '/icons/icon16.png'
  }
  return props.tab.favIconUrl
})

// 格式化URL
const formatUrl = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
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
  background: #f3f4f6;
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

  .drag-handle {
    display: none;
    color: #9ca3af;
    font-size: 14px;
    cursor: grab;
    padding: 4px;
  }

  .tab-item:hover .drag-handle {
    display: block;
  }

  .drag-handle:active {
    cursor: grabbing;
  }
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-url {
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
