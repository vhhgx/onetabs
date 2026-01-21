<template>
  <div class="settings-container">
    <div class="settings-header">
      <button @click="goBack" class="back-btn" title="返回">
        <i class="pi pi-arrow-left"></i>
      </button>
      <h1>设置</h1>
    </div>

    <!-- P0: 基础设置 -->
    <div class="settings-section">
      <h2>基础设置</h2>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="autoClose" @change="updateAutoClose" />
          <span class="label-text">收纳标签页后自动关闭插件页面</span>
        </label>
        <p class="setting-desc">点击收纳标签页按钮后,自动关闭插件页面</p>
      </div>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="keepPinned" @change="updateKeepPinned" />
          <span class="label-text">保留固定标签页</span>
        </label>
        <p class="setting-desc">收纳标签页时，保留固定的标签页不关闭</p>
      </div>

      <div class="setting-item">
        <label class="label-text">最大保存会话数量</label>
        <input 
          type="number" 
          v-model.number="maxSessions" 
          @change="updateMaxSessions"
          min="10"
          max="200"
          class="number-input"
        />
        <p class="setting-desc">超过此数量时，将自动删除最旧的会话（范围：10-200）</p>
      </div>
    </div>

    <!-- P1: 拖拽设置 -->
    <div class="settings-section">
      <h2>拖拽设置</h2>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="enableDrag" @change="updateEnableDrag" />
          <span class="label-text">启用拖拽功能</span>
        </label>
        <p class="setting-desc">允许通过拖拽将标签页添加到收藏集或模板</p>
      </div>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="removeAfterDrag" @change="updateRemoveAfterDrag" :disabled="!enableDrag" />
          <span class="label-text">拖拽后从源移除</span>
        </label>
        <p class="setting-desc">拖拽标签页到收藏集或模板后，从原会话中移除该标签页</p>
      </div>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="showDragPreview" @change="updateShowDragPreview" :disabled="!enableDrag" />
          <span class="label-text">显示拖拽预览</span>
        </label>
        <p class="setting-desc">拖拽时显示标签页信息预览（实验性功能）</p>
      </div>
    </div>

    <!-- P0: 数据管理 -->
    <div class="settings-section">
      <h2>数据管理</h2>
      <div class="button-group">
        <button @click="exportData" class="btn export-btn">导出数据</button>
        <input type="file" @change="importData" ref="importFile" style="display: none" accept=".json" />
        <button @click="triggerImport" class="btn import-btn">导入数据</button>
        <button @click="clearData" class="btn clear-btn">清除所有数据</button>
      </div>
      <p class="setting-desc">导出/导入您的标签页会话数据，或清除所有已保存的会话</p>
    </div>

    <!-- P2: 错误日志查看器 -->
    <div class="settings-section">
      <h2>错误日志</h2>
      <div class="button-group">
        <button @click="showErrorLogs" class="btn">
          <i class="pi pi-list"></i>
          查看错误日志
        </button>
        <button @click="exportErrorLogs" class="btn">
          <i class="pi pi-download"></i>
          导出日志
        </button>
        <button @click="clearErrorLogs" class="btn clear-btn">
          <i class="pi pi-trash"></i>
          清空日志
        </button>
      </div>
      <p class="setting-desc">查看、导出或清空应用程序错误日志（最多保存 100 条）</p>
    </div>
  </div>

  <!-- 错误日志对话框 -->
  <Dialog 
    v-model:visible="errorLogDialogVisible" 
    header="错误日志" 
    :style="{ width: '80vw', maxWidth: '900px' }"
    :modal="true"
  >
    <div class="error-logs-container">
      <div v-if="errorLogs.length === 0" class="no-logs">
        <i class="pi pi-check-circle" style="font-size: 3rem; color: #10b981;"></i>
        <p>没有错误日志</p>
      </div>
      <div v-else class="logs-list">
        <div v-for="(log, index) in errorLogs" :key="index" class="log-item" :class="`severity-${log.severity}`">
          <div class="log-header">
            <span class="log-severity">{{ getSeverityLabel(log.severity) }}</span>
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.stack" class="log-stack">
            <details>
              <summary>查看堆栈跟踪</summary>
              <pre>{{ log.stack }}</pre>
            </details>
          </div>
          <div v-if="log.context" class="log-context">
            <strong>上下文：</strong> {{ JSON.stringify(log.context, null, 2) }}
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <button @click="errorLogDialogVisible = false" class="btn">关闭</button>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useSessionsStore } from '../stores/sessionsStore'
import { useCollectionsStore } from '../stores/collectionsStore'
import { useTemplatesStore } from '../stores/templatesStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'
import { errorHandler } from '../utils/errorHandler'

const router = useRouter()
const settingsStore = useSettingsStore()
const sessionsStore = useSessionsStore()
const collectionsStore = useCollectionsStore()
const templatesStore = useTemplatesStore()
const toast = useToast()
const confirm = useConfirm()

// 设置项
const autoClose = ref(true)
const keepPinned = ref(false)
const maxSessions = ref(50)
const enableDrag = ref(true)
const removeAfterDrag = ref(false)
const showDragPreview = ref(true)

// 错误日志相关
const errorLogDialogVisible = ref(false)
const errorLogs = ref([])

// 导入文件引用
const importFile = ref(null)

// 返回主页
const goBack = () => {
  router.push('/')
}

// 页面加载时初始化
onMounted(async () => {
  try {
    await settingsStore.loadSettings()
    autoClose.value = settingsStore.autoClose
    keepPinned.value = settingsStore.keepPinned
    maxSessions.value = settingsStore.maxSessions
    enableDrag.value = settingsStore.enableDrag
    removeAfterDrag.value = settingsStore.removeAfterDrag
    showDragPreview.value = settingsStore.showDragPreview
  } catch (error) {
    console.error('加载设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '加载失败',
      detail: '无法加载设置，已使用默认值',
      life: 3000
    })
  }
})

// 更新自动关闭设置
const updateAutoClose = async () => {
  try {
    await settingsStore.updateSetting('autoClose', autoClose.value)
    toast.add({
      severity: 'success',
      summary: '设置已保存',
      detail: `自动关闭已${autoClose.value ? '开启' : '关闭'}`,
      life: 2000
    })
  } catch (error) {
    console.error('更新设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存设置',
      life: 3000
    })
  }
}

// 更新保留固定标签页设置
const updateKeepPinned = async () => {
  try {
    await settingsStore.updateSetting('keepPinned', keepPinned.value)
    toast.add({
      severity: 'success',
      summary: '设置已保存',
      detail: `保留固定标签页已${keepPinned.value ? '开启' : '关闭'}`,
      life: 2000
    })
  } catch (error) {
    console.error('更新设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存设置',
      life: 3000
    })
  }
}

// 更新最大会话数设置
const updateMaxSessions = async () => {
  try {
    // 确保值在范围内
    if (maxSessions.value < 10) maxSessions.value = 10
    if (maxSessions.value > 200) maxSessions.value = 200
    
    await settingsStore.updateSetting('maxSessions', maxSessions.value)
    toast.add({
      severity: 'success',
      summary: '设置已保存',
      detail: `最大会话数已设置为 ${maxSessions.value}`,
      life: 2000
    })
  } catch (error) {
    console.error('更新设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存设置',
      life: 3000
    })
  }
}

// 更新启用拖拽设置
const updateEnableDrag = async () => {
  try {
    await settingsStore.updateSetting('enableDrag', enableDrag.value)
    toast.add({
      severity: 'success',
      summary: '设置已保存',
      detail: `拖拽功能已${enableDrag.value ? '启用' : '禁用'}`,
      life: 2000
    })
  } catch (error) {
    console.error('更新设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存设置',
      life: 3000
    })
  }
}

// 更新拖拽后移除设置
const updateRemoveAfterDrag = async () => {
  try {
    await settingsStore.updateSetting('removeAfterDrag', removeAfterDrag.value)
    toast.add({
      severity: 'success',
      summary: '设置已保存',
      detail: `拖拽后移除已${removeAfterDrag.value ? '开启' : '关闭'}`,
      life: 2000
    })
  } catch (error) {
    console.error('更新设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存设置',
      life: 3000
    })
  }
}

// 更新显示拖拽预览设置
const updateShowDragPreview = async () => {
  try {
    await settingsStore.updateSetting('showDragPreview', showDragPreview.value)
    toast.add({
      severity: 'success',
      summary: '设置已保存',
      detail: `拖拽预览已${showDragPreview.value ? '开启' : '关闭'}`,
      life: 2000
    })
  } catch (error) {
    console.error('更新设置失败:', error)
    toast.add({
      severity: 'error',
      summary: '保存失败',
      detail: '无法保存设置',
      life: 3000
    })
  }
}

// 导出数据
const exportData = async () => {
  try {
    // 加载所有数据
    await sessionsStore.loadSessions()
    await collectionsStore.loadCollections()
    await templatesStore.loadTemplates()
    
    const data = {
      sessions: sessionsStore.sessions,
      collections: collectionsStore.collections,
      templates: templatesStore.templates,
      settings: settingsStore.getSettings,
      exportDate: new Date().toISOString(),
      version: '2.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `onetabs_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: '导出成功',
      detail: `已导出 ${data.sessions.length} 个会话、${data.collections.length} 个收藏集、${data.templates.length} 个模板`,
      life: 3000
    })
  } catch (error) {
    console.error('导出数据失败:', error)
    toast.add({
      severity: 'error',
      summary: '导出失败',
      detail: error.message || '无法导出数据',
      life: 3000
    })
  }
}

// 触发导入文件选择
const triggerImport = () => {
  importFile.value.click()
}

// 导入数据
const importData = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      // 验证数据格式
      if (!data.sessions && !data.collections && !data.templates) {
        throw new Error('无效的数据格式：未找到任何有效数据')
      }
      
      let importCount = {
        sessions: 0,
        collections: 0,
        templates: 0
      }
      
      // 导入会话数据
      if (data.sessions && Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          await sessionsStore.saveSession(session)
          importCount.sessions++
        }
        await sessionsStore.loadSessions()
      }
      
      // 导入收藏集数据
      if (data.collections && Array.isArray(data.collections)) {
        for (const collection of data.collections) {
          await collectionsStore.createCollection(collection)
          importCount.collections++
        }
        await collectionsStore.loadCollections()
      }
      
      // 导入模板数据
      if (data.templates && Array.isArray(data.templates)) {
        for (const template of data.templates) {
          await templatesStore.createTemplate(template)
          importCount.templates++
        }
        await templatesStore.loadTemplates()
      }
      
      // 如果有设置数据，也导入
      if (data.settings) {
        if (data.settings.autoClose !== undefined) {
          await settingsStore.updateSetting('autoClose', data.settings.autoClose)
          autoClose.value = data.settings.autoClose
        }
        if (data.settings.keepPinned !== undefined) {
          await settingsStore.updateSetting('keepPinned', data.settings.keepPinned)
          keepPinned.value = data.settings.keepPinned
        }
        if (data.settings.maxSessions !== undefined) {
          await settingsStore.updateSetting('maxSessions', data.settings.maxSessions)
          maxSessions.value = data.settings.maxSessions
        }
        if (data.settings.enableDrag !== undefined) {
          await settingsStore.updateSetting('enableDrag', data.settings.enableDrag)
          enableDrag.value = data.settings.enableDrag
        }
        if (data.settings.removeAfterDrag !== undefined) {
          await settingsStore.updateSetting('removeAfterDrag', data.settings.removeAfterDrag)
          removeAfterDrag.value = data.settings.removeAfterDrag
        }
        if (data.settings.showDragPreview !== undefined) {
          await settingsStore.updateSetting('showDragPreview', data.settings.showDragPreview)
          showDragPreview.value = data.settings.showDragPreview
        }
      }
      
      const summary = []
      if (importCount.sessions > 0) summary.push(`${importCount.sessions} 个会话`)
      if (importCount.collections > 0) summary.push(`${importCount.collections} 个收藏集`)
      if (importCount.templates > 0) summary.push(`${importCount.templates} 个模板`)
      
      toast.add({
        severity: 'success',
        summary: '导入成功',
        detail: `已导入 ${summary.join('、')}`,
        life: 3000
      })
      
      // 重置文件输入
      event.target.value = ''
    } catch (error) {
      console.error('导入数据失败:', error)
      toast.add({
        severity: 'error',
        summary: '导入失败',
        detail: error.message || '无法导入数据',
        life: 3000
      })
    }
  }
  reader.readAsText(file)
  
  // 重置文件输入
  event.target.value = null
}

// 清除所有数据 - 使用 ConfirmDialog
const clearData = () => {
  confirm.require({
    message: '确定要删除所有已保存的会话数据吗？此操作无法撤销。',
    header: '清除数据确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '确定清除',
    accept: async () => {
      try {
        await sessionsStore.clearAllSessions()
        
        toast.add({
          severity: 'success',
          summary: '清除成功',
          detail: '所有会话数据已清除',
          life: 3000
        })
      } catch (error) {
        console.error('清除数据失败:', error)
        toast.add({
          severity: 'error',
          summary: '清除失败',
          detail: error.message || '无法清除数据',
          life: 3000
        })
      }
    }
  })
}

// 显示错误日志
const showErrorLogs = () => {
  errorLogs.value = errorHandler.getLogs()
  errorLogDialogVisible.value = true
}

// 导出错误日志
const exportErrorLogs = () => {
  try {
    errorHandler.exportLogs()
    toast.add({
      severity: 'success',
      summary: '导出成功',
      detail: '错误日志已导出',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '导出失败',
      detail: '无法导出错误日志',
      life: 3000
    })
  }
}

// 清空错误日志
const clearErrorLogs = () => {
  confirm.require({
    message: '确定要清空所有错误日志吗？',
    header: '清空确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '清空',
    accept: async () => {
      try {
        await errorHandler.clearLogs()
        errorLogs.value = []
        toast.add({
          severity: 'success',
          summary: '清空成功',
          detail: '错误日志已清空',
          life: 2000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: '清空失败',
          detail: '无法清空错误日志',
          life: 3000
        })
      }
    }
  })
}

// 格式化日志时间
const formatLogTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取严重性标签
const getSeverityLabel = (severity) => {
  const labels = {
    error: '错误',
    warning: '警告',
    info: '信息'
  }
  return labels[severity] || severity
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background: #f3f4f6;
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(0);
}

.settings-container h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.settings-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.settings-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 8px;
}

.setting-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  cursor: pointer;
}

.label-text {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
}

.setting-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 8px 0 0 30px;
  line-height: 1.5;
}

.number-input {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 8px;
  transition: border-color 0.2s;
}

.number-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.export-btn {
  background-color: #10b981;
}

.export-btn:hover {
  background-color: #059669;
}

.import-btn {
  background-color: #3b82f6;
}

.import-btn:hover {
  background-color: #2563eb;
}

.clear-btn {
  background-color: #ef4444;
}

.clear-btn:hover {
  background-color: #dc2626;
}

/* 错误日志样式 */
.error-logs-container {
  max-height: 60vh;
  overflow-y: auto;
}

.no-logs {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-logs p {
  margin-top: 16px;
  font-size: 16px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #f9fafb;
}

.log-item.severity-error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.log-item.severity-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.log-item.severity-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-severity {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-error .log-severity {
  background: #fee2e2;
  color: #991b1b;
}

.severity-warning .log-severity {
  background: #fef3c7;
  color: #92400e;
}

.severity-info .log-severity {
  background: #dbeafe;
  color: #1e40af;
}

.log-time {
  font-size: 12px;
  color: #6b7280;
}

.log-message {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
}

.log-stack,
.log-context {
  margin-top: 12px;
  font-size: 12px;
}

.log-stack details {
  cursor: pointer;
  color: #3b82f6;
}

.log-stack summary {
  user-select: none;
  outline: none;
}

.log-stack pre {
  margin-top: 8px;
  padding: 12px;
  background: #1f2937;
  color: #f3f4f6;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
  line-height: 1.4;
}

.log-context {
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
