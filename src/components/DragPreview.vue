<template>
  <Teleport to="body">
    <div 
      v-if="isVisible" 
      class="drag-preview"
      :style="previewStyle"
    >
      <div class="preview-content">
        <!-- 多选徽章 -->
        <div v-if="count > 1" class="preview-badge">
          {{ count }}
        </div>

        <!-- 图标 -->
        <img
          v-if="faviconUrl"
          :src="faviconUrl"
          class="preview-icon"
          @error="(e) => e.target.style.display = 'none'"
        />
        <div v-else class="preview-icon-placeholder">
          <i class="pi pi-file"></i>
        </div>

        <!-- 信息 -->
        <div class="preview-info">
          <div class="preview-title">{{ tabData.title || '未命名' }}</div>
          <div class="preview-url">{{ formatUrl(tabData.url) }}</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getTabFaviconSync } from '../composables/useFavicon'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  tabData: {
    type: Object,
    default: () => ({})
  },
  count: {
    type: Number,
    default: 1
  }
})

const isVisible = computed(() => props.visible)

// 获取 favicon URL
const faviconUrl = computed(() => {
  return getTabFaviconSync(props.tabData)
})

// 预览样式（跟随鼠标）
const previewStyle = computed(() => ({
  left: `${props.x + 20}px`,
  top: `${props.y + 20}px`
}))

// 格式化 URL
const formatUrl = (url) => {
  if (!url) return ''
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + urlObj.pathname
  } catch {
    return url
  }
}
</script>

<style scoped>
.drag-preview {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  transform: translate(-50%, -50%);
  animation: dragIn 0.2s ease-out;
}

@keyframes dragIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.preview-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  max-width: 400px;
  padding: 12px 16px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.preview-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.preview-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
}

.preview-icon-placeholder {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 14px;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.preview-url {
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
