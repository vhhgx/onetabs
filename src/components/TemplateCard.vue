<template>
  <div 
    class="template-card card-hover"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="card-header" @click="toggleExpanded">
      <div class="header-left">
        <!-- 展开/折叠图标 -->
        <button class="expand-icon btn-press" :class="{ 'expanded': isExpanded }">
          <i class="pi pi-chevron-right"></i>
        </button>

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
      </div>

      <div class="card-actions" @click.stop>
        <button class="action-btn btn-press" @click="handleOpen" title="打开">
          <i class="pi pi-external-link"></i>
        </button>
        <button class="action-btn btn-press" @click="handleEdit" title="编辑">
          <i class="pi pi-pencil"></i>
        </button>
        <button class="action-btn btn-press" @click="handleDuplicate" title="复制">
          <i class="pi pi-copy"></i>
        </button>
        <button class="action-btn danger btn-press" @click="handleDelete" title="删除">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- 收藏集预览 -->
    <Transition name="expand">
      <div v-show="isExpanded" class="card-body">
        <div v-if="template.collections && template.collections.length > 0" class="collections-preview">
          <div class="preview-label">收藏集：</div>
          <TransitionGroup name="list" tag="div" class="collections-tags">
            <span 
              v-for="collection in template.collections" 
              :key="collection.id"
              class="collection-tag card-hover"
              :style="{ borderColor: getColorValue(collection.color) }"
            >
              <span class="tag-color" :style="{ backgroundColor: getColorValue(collection.color) }"></span>
              {{ collection.title }}
              <span class="tag-badge">{{ collection.tabs?.length || 0 }}</span>
            </span>
          </TransitionGroup>
        </div>

        <!-- 独立标签页提示 -->
        <div v-if="template.standaloneTabs && template.standaloneTabs.length > 0" class="standalone-section">
          <div class="preview-label">独立标签页：</div>
          <TransitionGroup name="list" tag="div" class="tabs-preview">
            <div
              v-for="(tab, index) in template.standaloneTabs"
              :key="tab.id || index"
              class="tab-preview-item card-hover"
            >
              <img 
                v-if="tab.favIconUrl" 
                :src="tab.favIconUrl" 
                class="tab-favicon"
                @error="(e) => e.target.style.display = 'none'"
              />
              <span class="tab-title">{{ tab.title || '未命名标签页' }}</span>
            </div>
          </TransitionGroup>
        </div>
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
import { getTemplateContextMenu } from '../utils/contextMenus'
import { useContextMenu } from '../composables/useContextMenu'

const props = defineProps({
  template: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open', 'edit', 'duplicate', 'delete', 'export'])

const confirm = useConfirm()
const toast = useToast()
const isExpanded = ref(false)
const { showContextMenu, contextMenuPosition, showMenu } = useContextMenu()

// 右键菜单配置
const contextMenuItems = computed(() => {
  return getTemplateContextMenu(props.template)
})

// 切换展开状态
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

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
  confirm.require({
    message: `确定要删除模板 "${props.template.name}" 吗？此操作无法撤销。`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    accept: () => {
      emit('delete', props.template.id)
    }
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
    case 'open':
      handleOpen()
      break
    case 'edit':
      handleEdit()
      break
    case 'duplicate':
      handleDuplicate()
      break
    case 'export':
      emit('export', props.template)
      break
    case 'delete':
      handleDelete()
      break
  }
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

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: flex-start;
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
  flex-shrink: 0;
}

.expand-icon:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.expand-icon.expanded {
  transform: rotate(90deg);
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
  opacity: 0;
  transition: opacity 0.2s;
}

.card-header:hover .card-actions {
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

/* 独立标签页部分 */
.standalone-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.tabs-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-preview-item:hover {
  background: #f9fafb;
}

.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-title {
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    padding: 16px;
  }

  .card-actions {
    opacity: 1;
  }

  .template-name {
    font-size: 16px;
  }

  .template-description {
    font-size: 12px;
  }

  .template-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .card-body {
    padding: 12px 16px;
  }
}
</style>
.card-footer i {
  font-size: 11px;
}
</style>
