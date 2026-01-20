<template>
  <div class="settings-container">
    <h1>设置</h1>

    <!-- P0: 基础设置 -->
    <div class="settings-section">
      <h2>基础设置</h2>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="autoClose" @change="updateAutoClose" />
          <span class="label-text">收纳标签页后自动关闭插件页面</span>
        </label>
        <p class="setting-desc">点击收纳标签页按钮后，自动关闭插件页面</p>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { useSessionsStore } from '../stores/sessionsStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const settingsStore = useSettingsStore()
const sessionsStore = useSessionsStore()
const toast = useToast()
const confirm = useConfirm()

// 设置项
const autoClose = ref(true)
const keepPinned = ref(false)
const maxSessions = ref(50)

// 导入文件引用
const importFile = ref(null)

// 页面加载时初始化
onMounted(async () => {
  try {
    await settingsStore.loadSettings()
    autoClose.value = settingsStore.autoClose
    keepPinned.value = settingsStore.keepPinned
    maxSessions.value = settingsStore.maxSessions
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

// 导出数据
const exportData = async () => {
  try {
    await sessionsStore.loadSessions()
    const data = {
      sessions: sessionsStore.sessions,
      settings: settingsStore.getSettings,
      exportDate: new Date().toISOString(),
      version: '1.0'
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
      detail: '数据已导出到文件',
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
      if (!data.sessions || !Array.isArray(data.sessions)) {
        throw new Error('无效的数据格式')
      }
      
      // 导入会话数据
      for (const session of data.sessions) {
        await sessionsStore.saveSession(session)
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
      }
      
      await sessionsStore.loadSessions()
      
      toast.add({
        severity: 'success',
        summary: '导入成功',
        detail: `已导入 ${data.sessions.length} 个会话`,
        life: 3000
      })
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
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

.settings-container h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 32px;
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
</style>

