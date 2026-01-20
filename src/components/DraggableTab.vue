<template>
  <div 
    class="draggable-tab"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    :class="{ 'dragging': isDragging }"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  tabData: {
    type: Object,
    required: true
  },
  sourceType: {
    type: String,
    required: true, // 'session', 'collection', 'template'
    validator: (value) => ['session', 'collection', 'template'].includes(value)
  },
  sourceId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['dragstart', 'dragend'])

const isDragging = ref(false)

const handleDragStart = (event) => {
  isDragging.value = true
  
  // 设置拖拽数据
  const dragData = {
    tab: props.tabData,
    sourceType: props.sourceType,
    sourceId: props.sourceId
  }
  
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.setData('text/plain', props.tabData.url)
  
  // 设置拖拽图像（可选）
  if (event.dataTransfer.setDragImage) {
    const dragImage = event.target.cloneNode(true)
    dragImage.style.opacity = '0.8'
    event.dataTransfer.setDragImage(event.target, 0, 0)
  }
  
  console.log('开始拖拽:', dragData)
  emit('dragstart', dragData)
}

const handleDragEnd = (event) => {
  isDragging.value = false
  console.log('拖拽结束')
  emit('dragend', event)
}
</script>

<style scoped>
.draggable-tab {
  cursor: move;
  transition: opacity 0.2s;
}

.draggable-tab.dragging {
  opacity: 0.5;
}

.draggable-tab:active {
  cursor: grabbing;
}
</style>
