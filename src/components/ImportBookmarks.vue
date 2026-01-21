<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="'导入书签'"
    :style="{ width: '600px' }"
    :dismissableMask="true"
    @hide="handleClose"
  >
    <div class="import-bookmarks">
      <!-- 导入方式选择 -->
      <div class="import-methods">
        <div
          class="method-card"
          :class="{ active: importMethod === 'file' }"
          @click="importMethod = 'file'"
        >
          <i class="pi pi-file"></i>
          <div class="method-title">HTML文件</div>
          <div class="method-desc">从Chrome导出的书签文件导入</div>
        </div>

        <div
          class="method-card"
          :class="{ active: importMethod === 'api' }"
          @click="importMethod = 'api'"
        >
          <i class="pi pi-chrome"></i>
          <div class="method-title">浏览器书签</div>
          <div class="method-desc">直接读取Chrome书签</div>
        </div>
      </div>

      <!-- 文件上传 -->
      <div v-if="importMethod === 'file'" class="file-upload-section">
        <div class="upload-area" @click="triggerFileSelect">
          <input
            ref="fileInput"
            type="file"
            accept=".html"
            @change="handleFileSelect"
            style="display: none"
          />
          <i class="pi pi-cloud-upload"></i>
          <div class="upload-text">
            <div class="upload-title">
              {{ selectedFile ? selectedFile.name : '点击选择文件' }}
            </div>
            <div class="upload-hint">支持Chrome导出的书签HTML文件</div>
          </div>
        </div>

        <div class="help-section">
          <div class="help-title">
            <i class="pi pi-info-circle"></i>
            如何导出Chrome书签？
          </div>
          <ol class="help-steps">
            <li>打开Chrome浏览器，点击右上角三点菜单</li>
            <li>选择"书签" > "书签管理器"</li>
            <li>点击右上角三点菜单，选择"导出书签"</li>
            <li>保存为HTML文件，然后在此导入</li>
          </ol>
        </div>
      </div>

      <!-- API导入说明 -->
      <div v-else class="api-import-section">
        <div class="info-box">
          <i class="pi pi-info-circle"></i>
          <div>
            <div class="info-title">自动读取Chrome书签</div>
            <div class="info-desc">
              将直接读取浏览器中的所有书签，无需手动导出文件
            </div>
          </div>
        </div>
      </div>

      <!-- 导入选项 -->
      <div class="import-options">
        <div class="option-title">导入选项</div>

        <div class="option-item">
          <RadioButton
            v-model="mergeMode"
            inputId="merge"
            name="mode"
            value="merge"
          />
          <label for="merge">
            <span class="option-label">合并到现有书签</span>
            <span class="option-desc">保留现有书签，自动跳过重复项</span>
          </label>
        </div>

        <div class="option-item">
          <RadioButton
            v-model="mergeMode"
            inputId="replace"
            name="mode"
            value="replace"
          />
          <label for="replace">
            <span class="option-label">替换所有书签</span>
            <span class="option-desc text-warning">将清空现有数据并导入</span>
          </label>
        </div>

        <div v-if="mergeMode === 'replace'" class="warning-box">
          <i class="pi pi-exclamation-triangle"></i>
          <span>警告：此操作将清空所有现有书签数据，且无法恢复！</span>
        </div>
      </div>

      <!-- 导入预览 -->
      <div v-if="previewData" class="preview-section">
        <div class="preview-header">
          <div class="preview-title">导入预览</div>
          <Button
            label="清除"
            icon="pi pi-times"
            text
            size="small"
            @click="clearPreview"
          />
        </div>

        <div class="preview-stats">
          <div class="stat-item">
            <div class="stat-value">
              {{ previewData.categories?.length || 0 }}
            </div>
            <div class="stat-label">分类</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ previewData.bookmarks?.length || 0 }}</div>
            <div class="stat-label">书签</div>
          </div>
          <div v-if="duplicateCount > 0" class="stat-item warning">
            <div class="stat-value">{{ duplicateCount }}</div>
            <div class="stat-label">重复</div>
          </div>
        </div>

        <ScrollPanel style="max-height: 200px" class="preview-list">
          <div
            v-for="category in previewData.categories"
            :key="category.id"
            class="category-item"
          >
            <i :class="category.icon || 'pi pi-folder'"></i>
            <span>{{ category.name }}</span>
            <span class="bookmark-count">
              ({{ getCategoryBookmarkCount(category) }})
            </span>
          </div>
        </ScrollPanel>
      </div>

      <!-- 进度条 -->
      <div v-if="importing" class="import-progress">
        <ProgressBar mode="indeterminate" />
        <div class="progress-text">正在导入...</div>
      </div>
    </div>

    <template #footer>
      <Button
        label="取消"
        text
        @click="handleClose"
        :disabled="importing"
      />
      <Button
        :label="previewData ? '开始导入' : '预览'"
        :icon="previewData ? 'pi pi-check' : 'pi pi-eye'"
        @click="previewData ? handleImport() : handlePreview()"
        :disabled="!canProceed || importing"
        :loading="importing"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import ProgressBar from 'primevue/progressbar'
import ScrollPanel from 'primevue/scrollpanel'
import {
  parseGoogleBookmarks,
  importFromChromeApi,
  mergeBookmarks,
} from '@/utils/bookmarkImporter'
import { useBookmarksStore } from '@/stores/bookmarksStore'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['update:show', 'imported'])

const toast = useToast()
const bookmarksStore = useBookmarksStore()

const visible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

// 导入方式：'file' 或 'api'
const importMethod = ref('file')
const selectedFile = ref(null)
const fileInput = ref(null)

// 导入选项
const mergeMode = ref('merge') // 'merge' 或 'replace'

// 预览数据
const previewData = ref(null)
const duplicateCount = ref(0)

// 状态
const importing = ref(false)

// 是否可以继续
const canProceed = computed(() => {
  if (importMethod.value === 'file') {
    return selectedFile.value !== null
  }
  return true // API方式始终可用
})

// 触发文件选择
function triggerFileSelect() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    selectedFile.value = file
    // 自动预览
    setTimeout(() => handlePreview(), 100)
  }
}

// 预览导入
async function handlePreview() {
  try {
    let importedData

    if (importMethod.value === 'file') {
      if (!selectedFile.value) {
        toast.add({
          severity: 'warn',
          summary: '提示',
          detail: '请选择要导入的文件',
          life: 3000,
        })
        return
      }

      // 读取文件内容
      const content = await readFileContent(selectedFile.value)
      importedData = parseGoogleBookmarks(content)
    } else {
      // 从API导入
      importedData = await importFromChromeApi()
    }

    if (
      !importedData ||
      !importedData.categories ||
      importedData.categories.length === 0
    ) {
      toast.add({
        severity: 'warn',
        summary: '提示',
        detail: '未找到可导入的书签',
        life: 3000,
      })
      return
    }

    previewData.value = importedData

    // 计算重复数量
    if (mergeMode.value === 'merge') {
      duplicateCount.value = calculateDuplicates(importedData)
    } else {
      duplicateCount.value = 0
    }

    toast.add({
      severity: 'success',
      summary: '预览成功',
      detail: `找到 ${importedData.categories.length} 个分类，${importedData.bookmarks.length} 个书签`,
      life: 3000,
    })
  } catch (error) {
    console.error('预览失败:', error)
    toast.add({
      severity: 'error',
      summary: '预览失败',
      detail: error.message || '无法解析书签文件',
      life: 3000,
    })
  }
}

// 执行导入
async function handleImport() {
  if (!previewData.value) {
    return
  }

  // 替换模式需要确认
  if (mergeMode.value === 'replace') {
    const confirmed = await showConfirmDialog()
    if (!confirmed) {
      return
    }
  }

  importing.value = true

  try {
    const currentData = { bookmarks: bookmarksStore.bookmarks }
    const result = mergeBookmarks(
      currentData,
      previewData.value,
      mergeMode.value
    )

    // 更新store
    await bookmarksStore.importBookmarks(result.bookmarks)

    toast.add({
      severity: 'success',
      summary: '导入成功',
      detail: `成功导入 ${result.mergedCount} 个书签${result.skippedCount > 0 ? `，跳过 ${result.skippedCount} 个重复项` : ''}`,
      life: 5000,
    })

    emit('imported', result)
    handleClose()
  } catch (error) {
    console.error('导入失败:', error)
    toast.add({
      severity: 'error',
      summary: '导入失败',
      detail: error.message || '导入过程中出现错误',
      life: 3000,
    })
  } finally {
    importing.value = false
  }
}

// 读取文件内容
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 计算重复书签数量
function calculateDuplicates(importedData) {
  const existingUrls = new Set()

  // 收集现有书签的URL
  function collectUrls(categories) {
    categories.forEach((cat) => {
      if (cat.bookmarks) {
        cat.bookmarks.forEach((b) => existingUrls.add(b.url.toLowerCase()))
      }
      if (cat.children) {
        collectUrls(cat.children)
      }
    })
  }

  collectUrls(bookmarksStore.bookmarks)

  // 统计重复数量
  let count = 0
  importedData.bookmarks.forEach((b) => {
    if (existingUrls.has(b.url.toLowerCase())) {
      count++
    }
  })

  return count
}

// 获取分类中的书签数量（包括子分类）
function getCategoryBookmarkCount(category) {
  if (!previewData.value) return 0

  const bookmarks = previewData.value.bookmarks.filter(
    (b) => b.categoryId === category.id || isInSubCategory(b.categoryId, category)
  )

  return bookmarks.length
}

function isInSubCategory(categoryId, parentCategory) {
  if (parentCategory.id === categoryId) return true

  if (parentCategory.children) {
    return parentCategory.children.some((child) =>
      isInSubCategory(categoryId, child)
    )
  }

  return false
}

// 显示确认对话框
function showConfirmDialog() {
  return new Promise((resolve) => {
    // 使用原生确认对话框
    const confirmed = window.confirm(
      '警告：此操作将删除所有现有书签数据！\n\n确定要继续吗？'
    )
    resolve(confirmed)
  })
}

// 清除预览
function clearPreview() {
  previewData.value = null
  duplicateCount.value = 0
}

// 关闭对话框
function handleClose() {
  if (!importing.value) {
    visible.value = false
    // 重置状态
    setTimeout(() => {
      selectedFile.value = null
      previewData.value = null
      duplicateCount.value = 0
      mergeMode.value = 'merge'
      importMethod.value = 'file'
    }, 300)
  }
}

// 切换导入方式时清除预览
watch(importMethod, () => {
  clearPreview()
  selectedFile.value = null
})
</script>

<style scoped>
.import-bookmarks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.import-methods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.method-card {
  padding: 20px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.method-card:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.method-card.active {
  border-color: var(--primary-color);
  background: var(--primary-bg);
}

.method-card i {
  font-size: 32px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.method-card.active i {
  color: var(--primary-color);
}

.method-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.method-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.file-upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.upload-area i {
  font-size: 48px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.upload-hint {
  font-size: 13px;
  color: var(--text-secondary);
}

.help-section {
  background: var(--surface-50);
  border-radius: 8px;
  padding: 16px;
}

.help-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.help-title i {
  color: var(--primary-color);
}

.help-steps {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.api-import-section {
  padding: 16px 0;
}

.info-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--surface-50);
  border-radius: 8px;
  border-left: 3px solid var(--primary-color);
}

.info-box i {
  font-size: 20px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.info-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.option-item:hover {
  background: var(--hover-bg);
}

.option-item label {
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.option-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.option-desc.text-warning {
  color: var(--orange-500);
}

.warning-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--orange-50);
  border: 1px solid var(--orange-200);
  border-radius: 6px;
  color: var(--orange-700);
  font-size: 13px;
}

.warning-box i {
  color: var(--orange-500);
}

.preview-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--surface-50);
  border-bottom: 1px solid var(--border-color);
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  padding: 16px;
  background: var(--surface-0);
}

.stat-item {
  text-align: center;
}

.stat-item.warning {
  color: var(--orange-500);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-list {
  padding: 16px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
}

.category-item:hover {
  background: var(--hover-bg);
}

.category-item i {
  color: var(--primary-color);
}

.bookmark-count {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 12px;
}

.import-progress {
  text-align: center;
}

.progress-text {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
