<template>
  <Dialog 
    v-model:visible="isVisible" 
    :header="isEditMode ? '编辑窗口模板' : '创建窗口模板'" 
    :modal="true"
    :closable="true"
    :draggable="false"
    class="template-editor"
    :style="{ width: '700px', maxHeight: '90vh' }"
    @hide="handleClose"
  >
    <div class="editor-content">
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        
        <div class="form-group">
          <label class="form-label">模板名称 *</label>
          <InputText 
            v-model="formData.name" 
            placeholder="输入模板名称"
            class="form-input"
            :class="{ 'input-error': errors.name }"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">描述</label>
          <Textarea 
            v-model="formData.description" 
            placeholder="输入模板描述（可选）"
            class="form-input"
            rows="2"
          />
        </div>
      </div>

      <!-- 创建方式选择 -->
      <div v-if="!isEditMode" class="form-section">
        <h3 class="section-title">创建方式</h3>
        <div class="creation-methods">
          <button 
            class="method-btn"
            :class="{ 'method-active': creationMethod === 'current' }"
            @click="creationMethod = 'current'"
          >
            <i class="pi pi-window-maximize"></i>
            <span>从当前窗口</span>
          </button>
          <button 
            class="method-btn"
            :class="{ 'method-active': creationMethod === 'manual' }"
            @click="creationMethod = 'manual'"
          >
            <i class="pi pi-plus-circle"></i>
            <span>手动创建</span>
          </button>
        </div>
      </div>

      <!-- 标签页组区域 -->
      <div class="form-section">
        <div class="section-header">
          <h3 class="section-title">标签页组 ({{ formData.collections.length }})</h3>
          <button 
            class="btn-icon" 
            @click="showCollectionSelector = true"
            title="添加标签页组"
          >
            <i class="pi pi-plus"></i>
          </button>
        </div>

        <div v-if="formData.collections.length > 0" class="collections-list">
          <div 
            v-for="(collection, index) in formData.collections" 
            :key="index"
            class="collection-item"
          >
            <div class="collection-drag-handle">
              <i class="pi pi-bars"></i>
            </div>
            <div class="collection-color" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
            <div class="collection-info">
              <div class="collection-name">
                {{ collection.title }}
                <span v-if="collection.isReference" class="badge badge-ref" title="引用模式：使用收藏集最新数据">
                  <i class="pi pi-link"></i> 引用
                </span>
                <span v-else class="badge badge-snapshot" title="快照模式：使用保存时的数据">
                  <i class="pi pi-lock"></i> 快照
                </span>
              </div>
              <div class="collection-meta">{{ collection.tabs.length }} 个标签页</div>
            </div>
            <div class="collection-actions">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="collection.createGroup"
                  class="checkbox-input"
                />
                <span>创建标签组</span>
              </label>
              <button 
                class="btn-icon-sm" 
                @click="toggleReferenceMode(index)"
                :title="collection.isReference ? '切换为快照模式' : '切换为引用模式'"
              >
                <i :class="collection.isReference ? 'pi pi-lock-open' : 'pi pi-lock'"></i>
              </button>
              <button class="btn-icon-sm btn-danger" @click="removeCollection(index)" title="删除">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-section">
          <i class="pi pi-inbox"></i>
          <p>还没有添加标签页组</p>
        </div>
      </div>

      <!-- 独立标签页区域 -->
      <div class="form-section">
        <div class="section-header">
          <h3 class="section-title">独立标签页 ({{ formData.standaloneTabs.length }})</h3>
          <button 
            class="btn-icon" 
            @click="showTabInput = !showTabInput"
            title="添加标签页"
          >
            <i class="pi pi-plus"></i>
          </button>
        </div>

        <!-- 手动添加标签页 -->
        <div v-if="showTabInput" class="tab-input-area">
          <InputText 
            v-model="newTabUrl" 
            placeholder="输入网址 (例: https://example.com)"
            class="form-input"
            @keyup.enter="addStandaloneTab"
          />
          <button class="btn btn-primary btn-sm" @click="addStandaloneTab">添加</button>
        </div>

        <div v-if="formData.standaloneTabs.length > 0" class="tabs-list">
          <div
            v-for="(tab, index) in formData.standaloneTabs"
            :key="index"
            class="tab-item"
          >
            <img
              :src="getTabIcon(tab)"
              class="tab-favicon"
              @error="(e) => e.target.style.display = 'none'"
            />
            <div class="tab-info">
              <div class="tab-title">{{ tab.title || tab.url }}</div>
              <div class="tab-url">{{ tab.url }}</div>
            </div>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="tab.pinned"
                class="checkbox-input"
              />
              <span>固定</span>
            </label>
            <button class="btn-icon-sm btn-danger" @click="removeStandaloneTab(index)" title="删除">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <div v-else class="empty-section">
          <i class="pi pi-inbox"></i>
          <p>还没有添加独立标签页</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button 
          class="btn btn-primary" 
          @click="handleSave"
          :disabled="!isValid || isSaving"
        >
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </template>
  </Dialog>

  <!-- 收藏集选择器 -->
  <Dialog 
    v-model:visible="showCollectionSelector" 
    header="选择标签页组" 
    :modal="true"
    :closable="true"
    class="collection-selector-dialog"
    :style="{ width: '500px' }"
  >
    <div class="selector-content">
      <div v-if="availableCollections.length === 0" class="empty-state">
        <p>还没有创建收藏集</p>
        <p class="hint">请先在"收藏集"页面创建收藏集</p>
      </div>
      <div v-else class="collections-selector-list">
        <div 
          v-for="collection in availableCollections" 
          :key="collection.id"
          class="selector-collection-item"
          @click="toggleCollectionSelection(collection)"
        >
          <input 
            type="checkbox" 
            :checked="isCollectionSelected(collection.id)"
            class="checkbox-input"
          />
          <div class="collection-color" :style="{ backgroundColor: getColorValue(collection.color) }"></div>
          <div class="collection-info">
            <div class="collection-name">{{ collection.title }}</div>
            <div class="collection-meta">{{ collection.tabs.length }} 个标签页</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="showCollectionSelector = false">取消</button>
        <button 
          class="btn btn-primary" 
          @click="addSelectedCollections"
          :disabled="selectedCollections.length === 0"
        >
          添加选中的收藏集 ({{ selectedCollections.length }})
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { getTabFaviconSync, extractDomain } from '@/composables/useFavicon'

// 获取标签页图标
const getTabIcon = (tab) => {
  return getTabFaviconSync(tab)
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  template: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'save'])

const toast = useToast()
const collectionsStore = useCollectionsStore()

// 状态
const isVisible = ref(false)
const isSaving = ref(false)
const creationMethod = ref('manual')
const showCollectionSelector = ref(false)
const showTabInput = ref(false)
const newTabUrl = ref('')
const selectedCollections = ref([])

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  collections: [],
  standaloneTabs: []
})

// 错误信息
const errors = reactive({
  name: ''
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

// 计算属性
const isEditMode = computed(() => !!props.template)

const isValid = computed(() => {
  return formData.name.trim().length > 0 && 
         (formData.collections.length > 0 || formData.standaloneTabs.length > 0)
})

const availableCollections = computed(() => {
  return collectionsStore.getCollections
})

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal
  if (newVal) {
    initForm()
  }
})

watch(isVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 初始化表单
const initForm = () => {
  if (props.template) {
    // 编辑模式
    formData.name = props.template.name
    formData.description = props.template.description
    formData.collections = [...props.template.collections]
    formData.standaloneTabs = [...props.template.standaloneTabs]
  } else {
    // 创建模式
    formData.name = ''
    formData.description = ''
    formData.collections = []
    formData.standaloneTabs = []
    creationMethod.value = 'manual'
  }
  errors.name = ''
  showCollectionSelector.value = false
  showTabInput.value = false
  newTabUrl.value = ''
  selectedCollections.value = []
}

// 收藏集选择相关
const isCollectionSelected = (collectionId) => {
  return selectedCollections.value.some(c => c.id === collectionId)
}

const toggleCollectionSelection = (collection) => {
  const index = selectedCollections.value.findIndex(c => c.id === collection.id)
  if (index > -1) {
    selectedCollections.value.splice(index, 1)
  } else {
    selectedCollections.value.push(collection)
  }
}

const addSelectedCollections = () => {
  selectedCollections.value.forEach(collection => {
    const exists = formData.collections.some(c => c.collectionId === collection.id)
    if (!exists) {
      formData.collections.push({
        collectionId: collection.id,
        title: collection.title,
        color: collection.color,
        createGroup: true,
        isReference: true, // 默认引用模式
        tabs: [...collection.tabs]
      })
    }
  })
  selectedCollections.value = []
  showCollectionSelector.value = false
  toast.add({
    severity: 'success',
    summary: '添加成功',
    detail: '收藏集已添加到模板',
    life: 2000
  })
}

// 删除收藏集
const removeCollection = (index) => {
  formData.collections.splice(index, 1)
}

// 切换引用/快照模式
const toggleReferenceMode = (index) => {
  const collection = formData.collections[index]
  collection.isReference = !collection.isReference
  
  // 如果切换到快照模式，需要从 collectionsStore 获取最新数据
  if (!collection.isReference && collection.collectionId) {
    const latestCollection = collectionsStore.getCollectionById(collection.collectionId)
    if (latestCollection) {
      collection.tabs = [...latestCollection.tabs]
      toast.add({
        severity: 'info',
        summary: '已锁定版本',
        detail: '当前收藏集数据已保存为快照',
        life: 2000
      })
    }
  }
}

// 添加独立标签页
const addStandaloneTab = () => {
  const url = newTabUrl.value.trim()
  if (!url) return

  // URL 验证
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    toast.add({
      severity: 'warn',
      summary: '无效的网址',
      detail: '请输入完整的网址，以 http:// 或 https:// 开头',
      life: 3000
    })
    return
  }

  const exists = formData.standaloneTabs.some(t => t.url === url)
  if (exists) {
    toast.add({
      severity: 'warn',
      summary: '重复的网址',
      detail: '该网址已在列表中',
      life: 2000
    })
    return
  }

  formData.standaloneTabs.push({
    title: url,
    url: url,
    domain: extractDomain(url),
    pinned: false
  })

  newTabUrl.value = ''
  showTabInput.value = false
  toast.add({
    severity: 'success',
    summary: '添加成功',
    detail: '标签页已添加',
    life: 2000
  })
}

// 删除独立标签页
const removeStandaloneTab = (index) => {
  formData.standaloneTabs.splice(index, 1)
}

// 验证表单
const validateForm = () => {
  errors.name = ''

  if (!formData.name.trim()) {
    errors.name = '请输入模板名称'
    return false
  }

  if (formData.collections.length === 0 && formData.standaloneTabs.length === 0) {
    toast.add({
      severity: 'warn',
      summary: '验证失败',
      detail: '请至少添加一个标签页组或标签页',
      life: 3000
    })
    return false
  }

  return true
}

// 保存
const handleSave = async () => {
  if (!validateForm()) return

  isSaving.value = true
  try {
    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      collections: formData.collections.map((c, index) => ({
        ...c,
        order: index
      })),
      standaloneTabs: formData.standaloneTabs
    }

    emit('save', data, creationMethod.value)
    handleClose()
  } catch (error) {
    console.error('保存模板失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: error.message || '无法保存模板',
      life: 3000
    })
  } finally {
    isSaving.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  isVisible.value = false
}

// 组件挂载时加载收藏集
onMounted(async () => {
  await collectionsStore.loadCollections()
})
</script>

<style scoped>
.editor-content {
  padding: 4px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
}

.error-message {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
}

/* 创建方式选择 */
.creation-methods {
  display: flex;
  gap: 12px;
}

.method-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-btn i {
  font-size: 24px;
  color: #6b7280;
}

.method-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.method-btn.method-active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.method-btn.method-active i {
  color: #3b82f6;
}

/* 收藏集列表 */
.collections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  transition: all 0.2s;
}

.collection-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.collection-drag-handle {
  color: #9ca3af;
  cursor: grab;
}

.collection-color {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-meta {
  font-size: 12px;
  color: #6b7280;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
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

.collection-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 标签页列表 */
.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
}

.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.tab-info {
  flex: 1;
  min-width: 0;
}

.tab-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-url {
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-input-area {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tab-input-area .form-input {
  flex: 1;
}

/* 复选框 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 按钮 */
.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #1f2937;
  border-color: #9ca3af;
}

.btn-icon-sm {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.btn-icon-sm.btn-danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 空状态 */
.empty-section {
  text-align: center;
  padding: 32px 20px;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 8px;
}

.empty-section i {
  font-size: 36px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-section p {
  margin: 4px 0;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 32px 20px;
  color: #9ca3af;
}

.empty-state .hint {
  font-size: 12px;
  color: #d1d5db;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 收藏集选择器 */
.selector-content {
  padding: 4px 0;
}

.collections-selector-list {
  max-height: 400px;
  overflow-y: auto;
}

.selector-collection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.selector-collection-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}
</style>
