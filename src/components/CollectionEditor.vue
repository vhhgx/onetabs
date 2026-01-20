<template>
  <Dialog 
    v-model:visible="isVisible" 
    :header="isEditMode ? '编辑收藏集' : '创建收藏集'" 
    :modal="true"
    :closable="true"
    :draggable="false"
    class="collection-editor"
    :style="{ width: '600px' }"
    @hide="handleClose"
  >
    <div class="editor-content">
      <!-- 收藏集名称 -->
      <div class="form-group">
        <label class="form-label">收藏集名称</label>
        <InputText 
          v-model="formData.name" 
          placeholder="输入收藏集名称"
          class="form-input"
          :class="{ 'input-error': errors.name }"
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>

      <!-- 颜色选择 -->
      <div class="form-group">
        <label class="form-label">标签颜色</label>
        <div class="color-picker">
          <div 
            v-for="color in availableColors" 
            :key="color.value"
            class="color-option"
            :class="{ 'color-selected': formData.color === color.value }"
            :style="{ backgroundColor: color.hex }"
            :title="color.label"
            @click="formData.color = color.value"
          >
            <i v-if="formData.color === color.value" class="pi pi-check"></i>
          </div>
        </div>
      </div>

      <!-- 标签页列表 -->
      <div class="form-group">
        <div class="tabs-header">
          <label class="form-label">标签页 ({{ formData.tabs.length }})</label>
          <div class="tabs-actions">
            <button class="btn-icon" @click="showTabSelector = true" title="从当前窗口选择">
              <i class="pi pi-list"></i>
            </button>
            <button class="btn-icon" @click="showManualInput = !showManualInput" title="手动添加">
              <i class="pi pi-plus"></i>
            </button>
          </div>
        </div>

        <!-- 手动添加 URL -->
        <div v-if="showManualInput" class="manual-input">
          <InputText 
            v-model="manualUrl" 
            placeholder="输入网址 (例: https://example.com)"
            class="form-input"
            @keyup.enter="addManualUrl"
          />
          <button class="btn btn-primary btn-sm" @click="addManualUrl">添加</button>
        </div>

        <!-- 标签页列表 -->
        <div v-if="formData.tabs.length > 0" class="tabs-list">
          <div 
            v-for="(tab, index) in formData.tabs" 
            :key="index"
            class="tab-item"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover.prevent
            @drop="handleDrop(index)"
          >
            <div class="tab-drag-handle">
              <i class="pi pi-bars"></i>
            </div>
            <img 
              v-if="tab.favIconUrl" 
              :src="tab.favIconUrl" 
              class="tab-favicon"
              @error="(e) => e.target.style.display = 'none'"
            />
            <div class="tab-info">
              <div class="tab-title">{{ tab.title || '未命名' }}</div>
              <div class="tab-url">{{ tab.url }}</div>
            </div>
            <button class="btn-remove" @click="removeTab(index)" title="删除">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="tabs-empty">
          <i class="pi pi-inbox"></i>
          <p>还没有添加标签页</p>
          <p class="hint">点击上方按钮添加标签页</p>
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

  <!-- 标签页选择器对话框 -->
  <Dialog 
    v-model:visible="showTabSelector" 
    header="选择标签页" 
    :modal="true"
    :closable="true"
    class="tab-selector-dialog"
    :style="{ width: '500px' }"
  >
    <div class="tab-selector-content">
      <div v-if="currentWindowTabs.length === 0" class="empty-state">
        <p>当前窗口没有标签页</p>
      </div>
      <div v-else class="current-tabs-list">
        <div 
          v-for="tab in currentWindowTabs" 
          :key="tab.id"
          class="current-tab-item"
          @click="toggleTabSelection(tab)"
        >
          <input 
            type="checkbox" 
            :checked="isTabSelected(tab)"
            class="tab-checkbox"
          />
          <img 
            v-if="tab.favIconUrl" 
            :src="tab.favIconUrl" 
            class="tab-favicon"
            @error="(e) => e.target.style.display = 'none'"
          />
          <div class="tab-info">
            <div class="tab-title">{{ tab.title || '未命名' }}</div>
            <div class="tab-url">{{ tab.url }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="showTabSelector = false">取消</button>
        <button class="btn btn-primary" @click="addSelectedTabs">
          添加选中的标签页 ({{ selectedTabs.length }})
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'save'])

const toast = useToast()

// 颜色选项
const availableColors = [
  { value: 'grey', hex: '#5f6368', label: '灰色' },
  { value: 'blue', hex: '#1a73e8', label: '蓝色' },
  { value: 'red', hex: '#d93025', label: '红色' },
  { value: 'yellow', hex: '#f9ab00', label: '黄色' },
  { value: 'green', hex: '#1e8e3e', label: '绿色' },
  { value: 'pink', hex: '#d01884', label: '粉色' },
  { value: 'purple', hex: '#a142f4', label: '紫色' },
  { value: 'cyan', hex: '#007b83', label: '青色' },
  { value: 'orange', hex: '#fa903e', label: '橙色' },
]

// 状态
const isVisible = ref(false)
const isSaving = ref(false)
const showManualInput = ref(false)
const showTabSelector = ref(false)
const manualUrl = ref('')
const currentWindowTabs = ref([])
const selectedTabs = ref([])
const draggedIndex = ref(null)

// 表单数据
const formData = reactive({
  name: '',
  color: 'blue',
  tabs: []
})

// 错误信息
const errors = reactive({
  name: ''
})

// 计算属性
const isEditMode = computed(() => !!props.collection)

const isValid = computed(() => {
  return formData.name.trim().length > 0
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
  if (props.collection) {
    // 编辑模式
    formData.name = props.collection.name
    formData.color = props.collection.color
    formData.tabs = [...props.collection.tabs]
  } else {
    // 创建模式
    formData.name = ''
    formData.color = 'blue'
    formData.tabs = []
  }
  errors.name = ''
  showManualInput.value = false
  showTabSelector.value = false
  manualUrl.value = ''
  selectedTabs.value = []
}

// 加载当前窗口标签页
const loadCurrentWindowTabs = async () => {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      currentWindowTabs.value = tabs.filter(tab => !tab.url.startsWith('chrome://'))
    }
  } catch (error) {
    console.error('加载当前窗口标签页失败:', error)
  }
}

// 标签页选择相关
const isTabSelected = (tab) => {
  return selectedTabs.value.some(t => t.id === tab.id)
}

const toggleTabSelection = (tab) => {
  const index = selectedTabs.value.findIndex(t => t.id === tab.id)
  if (index > -1) {
    selectedTabs.value.splice(index, 1)
  } else {
    selectedTabs.value.push(tab)
  }
}

const addSelectedTabs = () => {
  selectedTabs.value.forEach(tab => {
    const exists = formData.tabs.some(t => t.url === tab.url)
    if (!exists) {
      formData.tabs.push({
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl
      })
    }
  })
  selectedTabs.value = []
  showTabSelector.value = false
  toast.add({
    severity: 'success',
    summary: '添加成功',
    detail: '标签页已添加到收藏集',
    life: 2000
  })
}

// 手动添加 URL
const addManualUrl = () => {
  const url = manualUrl.value.trim()
  if (!url) return

  // 简单的 URL 验证
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    toast.add({
      severity: 'warn',
      summary: '无效的网址',
      detail: '请输入完整的网址，以 http:// 或 https:// 开头',
      life: 3000
    })
    return
  }

  const exists = formData.tabs.some(t => t.url === url)
  if (exists) {
    toast.add({
      severity: 'warn',
      summary: '重复的网址',
      detail: '该网址已在列表中',
      life: 2000
    })
    return
  }

  formData.tabs.push({
    title: url,
    url: url,
    favIconUrl: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
  })

  manualUrl.value = ''
  showManualInput.value = false
  toast.add({
    severity: 'success',
    summary: '添加成功',
    detail: '网址已添加到收藏集',
    life: 2000
  })
}

// 删除标签页
const removeTab = (index) => {
  formData.tabs.splice(index, 1)
}

// 拖拽排序
const handleDragStart = (index) => {
  draggedIndex.value = index
}

const handleDrop = (targetIndex) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return

  const draggedItem = formData.tabs[draggedIndex.value]
  formData.tabs.splice(draggedIndex.value, 1)
  formData.tabs.splice(targetIndex, 0, draggedItem)
  draggedIndex.value = null
}

// 验证表单
const validateForm = () => {
  errors.name = ''

  if (!formData.name.trim()) {
    errors.name = '请输入收藏集名称'
    return false
  }

  // 允许创建空收藏集，用户可以稍后添加标签页
  // if (formData.tabs.length === 0) {
  //   toast.add({
  //     severity: 'warn',
  //     summary: '验证失败',
  //     detail: '请至少添加一个标签页',
  //     life: 3000
  //   })
  //   return false
  // }

  return true
}

// 保存
const handleSave = async () => {
  if (!validateForm()) return

  isSaving.value = true
  try {
    const data = {
      name: formData.name.trim(),
      color: formData.color,
      tabs: formData.tabs.map((tab, index) => ({
        ...tab,
        order: index
      }))
    }

    // 等待保存完成
    await emit('save', data)
    
    toast.add({
      severity: 'success',
      summary: '保存成功',
      detail: isEditMode.value ? '收藏集已更新' : '收藏集已创建',
      life: 2000
    })

    // 延迟关闭，确保父组件处理完成
    setTimeout(() => {
      handleClose()
    }, 300)
  } catch (error) {
    console.error('保存收藏集失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: error.message || '无法保存收藏集',
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

// 组件挂载时加载当前窗口标签页
onMounted(() => {
  loadCurrentWindowTabs()
})

// 监听标签页选择器显示时重新加载
watch(showTabSelector, (newVal) => {
  if (newVal) {
    loadCurrentWindowTabs()
  }
})
</script>

<style scoped>
.editor-content {
  padding: 4px 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
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
  margin-top: 6px;
  font-size: 12px;
  color: #ef4444;
}

/* 颜色选择器 */
.color-picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-option.color-selected {
  border-color: #1f2937;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* 标签页列表头部 */
.tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tabs-actions {
  display: flex;
  gap: 8px;
}

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

/* 手动输入 */
.manual-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.manual-input .form-input {
  flex: 1;
}

/* 标签页列表 */
.tabs-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: move;
  transition: background 0.2s;
}

.tab-item:last-child {
  border-bottom: none;
}

.tab-item:hover {
  background: #f9fafb;
}

.tab-drag-handle {
  color: #9ca3af;
  cursor: grab;
}

.tab-drag-handle:active {
  cursor: grabbing;
}

.tab-favicon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.tab-info {
  flex: 1;
  min-width: 0;
}

.tab-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-url {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* 空状态 */
.tabs-empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.tabs-empty i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.tabs-empty p {
  margin: 4px 0;
  font-size: 14px;
}

.tabs-empty .hint {
  font-size: 12px;
  color: #d1d5db;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
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
  padding: 8px 16px;
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

/* 标签页选择器 */
.tab-selector-content {
  padding: 4px 0;
}

.current-tabs-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.current-tab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}

.current-tab-item:last-child {
  border-bottom: none;
}

.current-tab-item:hover {
  background: #f9fafb;
}

.tab-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}
</style>
