<template>
  <div 
    class="drop-zone"
    :class="{ 
      'drop-zone-active': isOver,
      'drop-zone-invalid': isOver && !isValidDrop
    }"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <slot></slot>
    
    <!-- 拖拽提示层 -->
    <div v-if="isOver" class="drop-overlay">
      <div class="drop-indicator">
        <i v-if="isValidDrop" class="pi pi-plus-circle"></i>
        <i v-else class="pi pi-ban"></i>
        <span>{{ dropMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  targetType: {
    type: String,
    required: true, // 'collection', 'template'
    validator: (value) => ['collection', 'template'].includes(value)
  },
  targetId: {
    type: String,
    default: ''
  },
  acceptFrom: {
    type: Array,
    default: () => ['session'] // 接受的源类型
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['drop'])

const isOver = ref(false)
const dragData = ref(null)

const isValidDrop = computed(() => {
  if (!dragData.value || props.disabled) return false
  return props.acceptFrom.includes(dragData.value.sourceType)
})

const dropMessage = computed(() => {
  if (!isValidDrop.value) {
    return '不支持此操作'
  }
  
  if (props.targetType === 'collection') {
    return '添加到收藏集'
  } else if (props.targetType === 'template') {
    return '添加到模板'
  }
  
  return '添加'
})

const handleDragOver = (event) => {
  event.preventDefault()
  
  if (isValidDrop.value) {
    event.dataTransfer.dropEffect = 'copy'
  } else {
    event.dataTransfer.dropEffect = 'none'
  }
}

const handleDragEnter = (event) => {
  event.preventDefault()
  isOver.value = true
  
  // 尝试解析拖拽数据
  try {
    const jsonData = event.dataTransfer.getData('application/json')
    if (jsonData) {
      dragData.value = JSON.parse(jsonData)
    }
  } catch (error) {
    console.warn('解析拖拽数据失败:', error)
  }
  
  console.log('进入拖放区:', props.targetType, props.targetId)
}

const handleDragLeave = (event) => {
  // 只有真正离开时才重置
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    isOver.value = false
    dragData.value = null
    console.log('离开拖放区')
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  isOver.value = false
  
  if (!isValidDrop.value) {
    console.warn('无效的拖放操作')
    return
  }
  
  try {
    const jsonData = event.dataTransfer.getData('application/json')
    const dropData = JSON.parse(jsonData)
    
    console.log('拖放成功:', dropData, '目标:', props.targetType, props.targetId)
    
    emit('drop', {
      dragData: dropData,
      targetType: props.targetType,
      targetId: props.targetId
    })
  } catch (error) {
    console.error('处理拖放失败:', error)
  } finally {
    dragData.value = null
  }
}
</script>

<style scoped>
.drop-zone {
  position: relative;
  transition: all 0.2s;
}

.drop-zone-active {
  position: relative;
}

.drop-zone-active::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.05);
  pointer-events: none;
  z-index: 1;
}

.drop-zone-invalid::before {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  z-index: 2;
  pointer-events: none;
}

.drop-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.drop-indicator i {
  font-size: 32px;
}

.drop-zone-active .drop-indicator i {
  color: #3b82f6;
}

.drop-zone-invalid .drop-indicator i {
  color: #ef4444;
}

.drop-indicator span {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
</style>
