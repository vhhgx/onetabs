<template>
  <div class="template-card">
    <div class="card-header">
      <div class="template-icon">
        <i class="pi pi-window-maximize"></i>
      </div>
      <div class="template-info">
        <h3 class="template-name">{{ template.name }}</h3>
        <p v-if="template.description" class="template-description">
          {{ template.description }}
        </p>
        
        <!-- 统计信息 -->
        <div class="template-stats">
          <span class="stat-item">
            <i class="pi pi-folder"></i>
            {{ collectionsCount }} 个收藏集
          </span>
          <span class="stat-item">
            <i class="pi pi-book"></i>
            {{ tabsCount }} 个标签页
          </span>
        </div>

        <!-- 最后更新时间 -->
        <div class="template-meta">
          <span class="meta-time">
            <i class="pi pi-clock"></i>
            {{ formatTime(template.updatedAt || template.createdAt) }}
          </span>
        </div>
      </div>

      <div class="card-actions">
        <button class="action-btn" @click="handleOpen" title="打开">
          <i class="pi pi-external-link"></i>
        </button>
        <button class="action-btn" @click="handleEdit" title="编辑">
          <i class="pi pi-pencil"></i>
        </button>
        <button class="action-btn" @click="handleDuplicate" title="复制">
          <i class="pi pi-copy"></i>
        </button>
        <button class="action-btn danger" @click="handleDelete" title="删除">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- 收藏集预览 -->
    <div v-if="template.collections && template.collections.length > 0" class="card-body">
      <div class="collections-preview">
        <div class="preview-label">收藏集：</div>
        <div class="collections-tags">
          <span 
            v-for="collection in displayCollections" 
            :key="collection.id"
            class="collection-tag"
            :style="{ borderColor: getColorValue(collection.color) }"
          >
            <span class="tag-color" :style="{ backgroundColor: getColorValue(collection.color) }"></span>
            {{ collection.name }}
            <span class="tag-badge">{{ collection.tabs?.length || 0 }}</span>
          </span>
          <span v-if="template.collections.length > 3" class="more-tag">
            +{{ template.collections.length - 3 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 独立标签页提示 -->
    <div v-if="template.standaloneTabs && template.standaloneTabs.length > 0" class="card-footer">
      <i class="pi pi-bookmark"></i>
      <span>包含 {{ template.standaloneTabs.length }} 个独立标签页</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  template: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open', 'edit', 'duplicate', 'delete'])

// 计算收藏集和标签页数量
const collectionsCount = computed(() => {
  return props.template.collections?.length || 0
})

const tabsCount = computed(() => {
  let count = 0
  
  // 收藏集中的标签页
  if (props.template.collections) {
    count += props.template.collections.reduce((sum, col) => 
      sum + (col.tabs?.length || 0), 0
    )
  }
  
  // 独立标签页
  if (props.template.standaloneTabs) {
    count += props.template.standaloneTabs.length
  }
  
  return count
})

// 显示前3个收藏集
const displayCollections = computed(() => {
  return props.template.collections?.slice(0, 3) || []
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

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }
  
  // 超过7天，显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 事件处理
const handleOpen = () => {
  emit('open', props.template.id)
}

const handleEdit = () => {
  emit('edit', props.template)
}

const handleDuplicate = () => {
  emit('duplicate', props.template.id)
}

const handleDelete = () => {
  emit('delete', props.template.id)
}
</script>

<style scoped>
.template-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  overflow: hidden;
}

.template-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}

.template-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.stat-item i {
  font-size: 12px;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.meta-time i {
  font-size: 11px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

/* 收藏集预览 */
.card-body {
  border-top: 1px solid #f3f4f6;
  padding: 16px 20px;
}

.collections-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collections-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.collection-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  transition: all 0.2s;
}

.collection-tag:hover {
  background: #f3f4f6;
}

.tag-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: white;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.more-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  background: #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #6b7280;
}

.card-footer i {
  font-size: 11px;
}
</style>
