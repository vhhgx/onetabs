<template>
  <div class="templates-view">
    <div class="templates-container">
      <!-- 顶部操作栏 -->
      <div class="templates-header">
        <h2 class="header-title">窗口模板</h2>
        <div class="header-actions">
          <button class="btn btn-primary" @click="openCreateDialog" :disabled="isLoading">
            <i class="pi pi-plus"></i>
            <span>新建模板</span>
          </button>
          <button class="btn btn-secondary" @click="createFromCurrentWindow" :disabled="isLoading">
            <i class="pi pi-window-maximize"></i>
            <span>从当前窗口创建</span>
          </button>
          <button class="btn btn-secondary" @click="addMockTemplate" :disabled="isLoading">
            <i class="pi pi-code"></i>
            <span>添加测试数据</span>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!isLoading && templates.length === 0" class="empty-state">
        <div class="empty-icon">🚀</div>
        <p class="empty-text">还没有窗口模板</p>
        <p class="empty-hint">创建窗口模板来快速恢复工作环境</p>
        <p class="empty-hint">点击"新建模板"或"从当前窗口创建"开始</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 模板列表 -->
      <div v-else-if="templates.length > 0" class="templates-list">
        <DropZone
          v-for="template in templates" 
          :key="template.id"
          target-type="template"
          :target-id="template.id"
          :accept-from="['session']"
          @drop="handleDropToTemplate"
        >
          <div class="template-card">
            <div class="card-header">
              <div class="header-left">
                <div class="template-icon">{{ template.icon || '📋' }}</div>
                <div class="template-info">
                  <h3 class="template-name">{{ template.name }}</h3>
                  <p v-if="template.description" class="template-description">{{ template.description }}</p>
                  <div class="template-meta">
                    <span v-if="template.collections.length > 0">
                      <i class="pi pi-folder"></i> {{ template.collections.length }} 个标签页组
                    </span>
                    <span v-if="template.standaloneTabs.length > 0">
                      <i class="pi pi-file"></i> {{ template.standaloneTabs.length }} 个标签页
                    </span>
                    <span class="update-time">{{ formatTime(template.updatedAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="header-actions">
                <button class="action-btn" @click="openTemplate(template.id)" title="打开窗口">
                  <i class="pi pi-external-link"></i>
                </button>
                <button class="action-btn" @click="editTemplate(template)" title="编辑">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn" @click="duplicateTemplate(template.id)" title="复制">
                  <i class="pi pi-copy"></i>
                </button>
                <button class="action-btn danger" @click="deleteTemplate(template.id)" title="删除">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

          <!-- 模板内容预览 -->
          <div v-if="template.collections.length > 0 || template.standaloneTabs.length > 0" class="template-content">
            <!-- 标签页组列表 -->
            <div v-if="template.collections.length > 0" class="collections-section">
              <div class="section-title">📁 标签页组 ({{ template.collections.length }})</div>
              <div class="collections-list-expanded">
                <div 
                  v-for="(collection, index) in template.collections" 
                  :key="index"
                  class="collection-item-expanded"
                >
                  <div class="collection-header-mini">
                    <div class="collection-color-mini" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
                    <span class="collection-name-mini">{{ collection.name }}</span>
                    <span class="collection-count-mini">({{ collection.tabs?.length || 0 }})</span>
                    <span v-if="collection.isReference" class="badge-tiny badge-ref">引用</span>
                    <span v-else class="badge-tiny badge-snapshot">快照</span>
                  </div>
                  <!-- 显示该标签组内的标签页 -->
                  <div v-if="collection.tabs && collection.tabs.length > 0" class="tabs-mini-list">
                    <div 
                      v-for="(tab, tabIndex) in collection.tabs.slice(0, 5)" 
                      :key="tabIndex"
                      class="tab-mini-item"
                    >
                      <img 
                        v-if="tab.favIconUrl" 
                        :src="tab.favIconUrl" 
                        class="tab-favicon-mini"
                        @error="(e) => e.target.style.display = 'none'"
                      />
                      <span class="tab-title-mini">{{ tab.title || tab.url }}</span>
                    </div>
                    <div v-if="collection.tabs.length > 5" class="more-tabs-indicator">
                      还有 {{ collection.tabs.length - 5 }} 个标签页...
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 独立标签页列表 -->
            <div v-if="template.standaloneTabs && template.standaloneTabs.length > 0" class="standalone-section">
              <div class="section-title">🔗 独立标签页 ({{ template.standaloneTabs.length }})</div>
              <div class="tabs-mini-list">
                <div 
                  v-for="(tab, index) in template.standaloneTabs.slice(0, 5)" 
                  :key="index"
                  class="tab-mini-item"
                >
                  <img 
                    v-if="tab.favIconUrl" 
                    :src="tab.favIconUrl" 
                    class="tab-favicon-mini"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                  <span class="tab-title-mini">{{ tab.title || tab.url }}</span>
                </div>
                <div v-if="template.standaloneTabs.length > 5" class="more-tabs-indicator">
                  还有 {{ template.standaloneTabs.length - 5 }} 个标签页...
                </div>
              </div>
            </div>
          </div>
          </div>
        </DropZone>
      </div>
    </div>

    <!-- 模板编辑器 -->
    <TemplateEditor 
      v-model:visible="showEditor"
      :template="editingTemplate"
      @save="handleSaveTemplate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTemplatesStore } from '@/stores/templatesStore'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import TemplateEditor from '@/components/TemplateEditor.vue'
import DropZone from '@/components/DropZone.vue'

const templatesStore = useTemplatesStore()
const collectionsStore = useCollectionsStore()
const toast = useToast()
const confirm = useConfirm()

// 状态
const isLoading = computed(() => templatesStore.isLoading)
const templates = computed(() => templatesStore.getTemplates)
const showEditor = ref(false)
const editingTemplate = ref(null)

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
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 页面挂载时加载数据
onMounted(async () => {
  console.log('TemplatesView 挂载，开始加载数据')
  await Promise.all([
    templatesStore.loadTemplates(),
    collectionsStore.loadCollections()
  ])
  console.log('窗口模板数据加载完成，数量:', templates.value.length)
})

// 打开创建对话框
const openCreateDialog = () => {
  editingTemplate.value = null
  showEditor.value = true
}

// 从当前窗口创建
const createFromCurrentWindow = async () => {
  try {
    const name = `窗口模板 ${new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    await templatesStore.createFromCurrentWindow(name, '从当前窗口自动生成')
    await templatesStore.loadTemplates()
    
    toast.add({
      severity: 'success',
      summary: '创建成功',
      detail: '已从当前窗口创建模板',
      life: 3000
    })
  } catch (error) {
    console.error('从当前窗口创建模板失败:', error)
    toast.add({
      severity: 'error',
      summary: '创建失败',
      detail: error.message || '无法创建模板',
      life: 3000
    })
  }
}

// 编辑模板
const editTemplate = (template) => {
  editingTemplate.value = template
  showEditor.value = true
}

// 保存模板
const handleSaveTemplate = async (data, creationMethod) => {
  try {
    if (editingTemplate.value) {
      // 更新现有模板
      await templatesStore.updateTemplate(editingTemplate.value.id, data)
      toast.add({
        severity: 'success',
        summary: '更新成功',
        detail: '模板已更新',
        life: 2000
      })
    } else {
      // 创建新模板
      if (creationMethod === 'current') {
        await templatesStore.createFromCurrentWindow(data.name, data.description)
      } else {
        await templatesStore.createTemplate(data)
      }
      toast.add({
        severity: 'success',
        summary: '创建成功',
        detail: '模板已创建',
        life: 2000
      })
    }
    await templatesStore.loadTemplates()
  } catch (error) {
    console.error('保存模板失败:', error)
    throw error
  }
}

// 打开模板
const openTemplate = async (id) => {
  try {
    await templatesStore.openTemplate(id, {
      inBackground: false
    })
    toast.add({
      severity: 'success',
      summary: '打开成功',
      detail: '窗口模板已在新窗口打开',
      life: 3000
    })
  } catch (error) {
    console.error('打开模板失败:', error)
    toast.add({
      severity: 'error',
      summary: '打开失败',
      detail: error.message || '无法打开模板',
      life: 3000
    })
  }
}

// 复制模板
const duplicateTemplate = async (id) => {
  try {
    await templatesStore.duplicateTemplate(id)
    await templatesStore.loadTemplates()
    toast.add({
      severity: 'success',
      summary: '复制成功',
      detail: '模板已复制',
      life: 2000
    })
  } catch (error) {
    console.error('复制模板失败:', error)
    toast.add({
      severity: 'error',
      summary: '复制失败',
      detail: error.message || '无法复制模板',
      life: 3000
    })
  }
}

// 处理拖放到模板
const handleDropToTemplate = async (event) => {
  console.log('拖放到模板:', event)
  // TODO: 实现拖放功能
  toast.add({
    severity: 'info',
    summary: '功能开发中',
    detail: '拖放功能即将上线',
    life: 2000
  })
}

// 删除模板
const deleteTemplate = (id) => {
  confirm.require({
    message: '确定要删除这个窗口模板吗？此操作无法撤销。',
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    accept: async () => {
      try {
        await templatesStore.deleteTemplate(id)
        await templatesStore.loadTemplates()
        toast.add({
          severity: 'success',
          summary: '删除成功',
          detail: '模板已删除',
          life: 3000
        })
      } catch (error) {
        console.error('删除模板失败:', error)
        toast.add({
          severity: 'error',
          summary: '删除失败',
          detail: error.message || '无法删除模板',
          life: 3000
        })
      }
    }
  })
}

// 添加测试数据
const addMockTemplate = async () => {
  try {
    // 确保有收藏集数据
    await collectionsStore.loadCollections()
    const collections = collectionsStore.getCollections
    
    const mockData = {
      name: '工作环境模板',
      description: '包含开发、文档和通讯工具的完整工作环境',
      collections: collections.length > 0 ? [
        {
          collectionId: collections[0].id,
          name: collections[0].name,
          color: collections[0].color,
          createGroup: true,
          isReference: true,
          tabs: collections[0].tabs
        }
      ] : [],
      standaloneTabs: [
        {
          title: 'Gmail',
          url: 'https://mail.google.com',
          favIconUrl: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
          pinned: true
        },
        {
          title: 'Calendar',
          url: 'https://calendar.google.com',
          favIconUrl: 'https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_14.ico',
          pinned: true
        }
      ]
    }
    
    await templatesStore.createTemplate(mockData)
    await templatesStore.loadTemplates()
    
    toast.add({
      severity: 'success',
      summary: '添加成功',
      detail: '已添加测试模板',
      life: 3000
    })
  } catch (error) {
    console.error('添加测试数据失败:', error)
    toast.add({
      severity: 'error',
      summary: '添加失败',
      detail: error.message || '无法添加测试数据',
      life: 3000
    })
  }

// 处理拖放到模板
const handleDropToTemplate = async ({ dragData, targetId }) => {
  try {
    console.log('拖放标签页到模板:', dragData.tab.title, '→', targetId)
    
    const template = templatesStore.getTemplateById(targetId)
    if (!template) {
      throw new Error('模板不存在')
    }
    
    // 添加标签页到模板的独立标签页列表
    const updatedStandaloneTabs = [
      ...template.standaloneTabs,
      {
        title: dragData.tab.title,
        url: dragData.tab.url,
        favIconUrl: dragData.tab.favIconUrl || '',
        pinned: false
      }
    ]
    
    await templatesStore.updateTemplate(targetId, {
      standaloneTabs: updatedStandaloneTabs
    })
    
    await templatesStore.loadTemplates()
    
    toast.add({
      severity: 'success',
      summary: '添加成功',
      detail: `"${dragData.tab.title}" 已添加到模板`,
      life: 3000
    })
  } catch (error) {
    console.error('拖放到模板失败:', error)
    toast.add({
      severity: 'error',
      summary: '添加失败',
      detail: error.message || '无法添加标签页',
      life: 3000
    })
  }
}
}
</script>

<style scoped>
.templates-view {
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
}

.templates-container {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

/* 顶部操作栏 */
.templates-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #6b7280;
}

.empty-hint {
  font-size: 14px;
  margin: 4px 0;
  color: #9ca3af;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
  color: #9ca3af;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 模板列表 */
.templates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  padding-bottom: 24px;
}

.template-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.template-icon {
  font-size: 32px;
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
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.template-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.update-time {
  margin-left: auto;
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

/* 模板内容预览 */
.template-content {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.collections-section,
.standalone-section {
  margin-bottom: 16px;
}

.collections-section:last-child,
.standalone-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.collections-list-expanded {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-item-expanded {
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px;
}

.collection-header-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.collection-color-mini {
  width: 8px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.collection-name-mini {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.collection-count-mini {
  font-size: 12px;
  color: #9ca3af;
}

.badge-tiny {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  margin-left: auto;
}

.badge-ref {
  background: #dbeafe;
  color: #1e40af;
}

.badge-snapshot {
  background: #fef3c7;
  color: #92400e;
}

.tabs-mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 16px;
}

.tab-mini-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
}

.tab-favicon-mini {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-title-mini {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.more-tabs-indicator {
  font-size: 11px;
  color: #9ca3af;
  padding: 4px 8px;
  text-align: center;
}

.collections-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collection-preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.collection-color {
  width: 3px;
  height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}

.collection-name {
  font-weight: 500;
  color: #374151;
}

.collection-count {
  color: #9ca3af;
}

.badge-small {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.badge-ref {
  background: #dbeafe;
  color: #1e40af;
}

.badge-snapshot {
  background: #fef3c7;
  color: #92400e;
}

.more-indicator {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}
</style>
