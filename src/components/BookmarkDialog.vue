<template>
  <Dialog
    :visible="visible"
    :header="isEditMode ? '编辑书签' : '添加书签'"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '500px' }"
    @update:visible="handleClose"
  >
    <div class="bookmark-dialog-content">
      <!-- 名称 -->
      <div class="form-field">
        <label class="field-label">
          <span>名称</span>
          <span class="required">*</span>
        </label>
        <InputText
          v-model="formData.title"
          placeholder="请输入书签名称"
          :class="{ 'p-invalid': errors.title }"
          @input="clearError('title')"
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>

      <!-- URL -->
      <div class="form-field">
        <label class="field-label">
          <span>URL</span>
          <span class="required">*</span>
        </label>
        <div class="url-input-group">
          <InputText
            v-model="formData.url"
            placeholder="请输入网址，如 https://example.com"
            :class="{ 'p-invalid': errors.url }"
            @input="clearError('url')"
            @blur="handleUrlBlur"
          />
          <Button
            icon="pi pi-refresh"
            text
            rounded
            :loading="isFetchingIcon"
            @click="fetchFavIcon"
            title="获取网站图标"
          />
        </div>
        <small v-if="errors.url" class="p-error">{{ errors.url }}</small>
      </div>

      <!-- 图标 -->
      <div class="form-field">
        <label class="field-label">网站图标</label>
        <div class="icon-preview">
          <img
            :src="formData.favIconUrl || defaultIcon"
            alt="图标"
            class="favicon-img"
            @error="handleIconError"
          />
          <InputText
            v-model="formData.favIconUrl"
            placeholder="自动获取或手动输入图标地址"
            class="icon-url-input"
          />
        </div>
      </div>

      <!-- 描述 -->
      <div class="form-field">
        <label class="field-label">描述</label>
        <Textarea
          v-model="formData.description"
          placeholder="可选，添加书签描述"
          :rows="3"
          :autoResize="true"
        />
      </div>

      <!-- 分类选择 -->
      <div class="form-field">
        <label class="field-label">
          <span>分类</span>
          <span class="required">*</span>
        </label>
        <div class="category-selectors">
          <Dropdown
            v-model="formData.firstLevel"
            :options="firstLevelCategories"
            optionLabel="title"
            optionValue="id"
            placeholder="选择一级分类"
            :class="{ 'p-invalid': errors.firstLevel }"
            @change="handleFirstLevelChange"
          />
          <Dropdown
            v-model="formData.secondLevel"
            :options="secondLevelCategories"
            optionLabel="title"
            optionValue="id"
            placeholder="选择二级分类（可选）"
            :disabled="!formData.firstLevel"
            @change="handleSecondLevelChange"
          />
          <Dropdown
            v-model="formData.thirdLevel"
            :options="thirdLevelCategories"
            optionLabel="title"
            optionValue="id"
            placeholder="选择三级分类（可选）"
            :disabled="!formData.secondLevel"
          />
        </div>
        <small v-if="errors.firstLevel" class="p-error">{{ errors.firstLevel }}</small>
      </div>

      <!-- 标签 -->
      <div class="form-field">
        <label class="field-label">标签</label>
        <div class="tags-input">
          <Chip
            v-for="(tag, index) in formData.tags"
            :key="index"
            :label="tag"
            removable
            @remove="removeTag(index)"
          />
          <InputText
            v-model="newTag"
            placeholder="输入标签后按回车"
            class="tag-input"
            @keyup.enter="addTag"
          />
        </div>
      </div>

      <!-- 快捷选项 -->
      <div class="form-field">
        <div class="quick-options">
          <div class="option-item">
            <Checkbox v-model="formData.isPinned" :binary="true" inputId="pinned" />
            <label for="pinned">固定书签</label>
          </div>
          <div class="option-item">
            <Checkbox v-model="formData.isFavorite" :binary="true" inputId="favorite" />
            <label for="favorite">收藏书签</label>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="取消" severity="secondary" @click="handleClose" />
        <Button
          :label="isEditMode ? '保存' : '添加'"
          :loading="isSaving"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBookmarksStore } from '../stores/bookmarksStore'
import { useToast } from 'primevue/usetoast'
import { isValidUrl, formatUrl, getFavIconUrl } from '../utils/urlValidator'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Chip from 'primevue/chip'

const bookmarksStore = useBookmarksStore()
const toast = useToast()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  bookmark: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'saved'])

const defaultIcon = 'https://www.google.com/favicon.ico'
const isSaving = ref(false)
const isFetchingIcon = ref(false)
const newTag = ref('')
const errors = ref({})

// 表单数据
const formData = ref({
  title: '',
  url: '',
  description: '',
  favIconUrl: '',
  firstLevel: null,
  secondLevel: null,
  thirdLevel: null,
  tags: [],
  isPinned: false,
  isFavorite: false,
})

// 是否为编辑模式
const isEditMode = computed(() => !!props.bookmark)

// 分类选项
const firstLevelCategories = computed(() => bookmarksStore.getFirstLevelCategories)
const secondLevelCategories = computed(() => {
  if (!formData.value.firstLevel) return []
  return bookmarksStore.getSecondLevelCategories(formData.value.firstLevel)
})
const thirdLevelCategories = computed(() => {
  if (!formData.value.firstLevel || !formData.value.secondLevel) return []
  return bookmarksStore.getThirdLevelCategories(
    formData.value.firstLevel,
    formData.value.secondLevel
  )
})

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    url: '',
    description: '',
    favIconUrl: '',
    firstLevel: bookmarksStore.getCurrentFirstLevel || null,
    secondLevel: bookmarksStore.getCurrentSecondLevel || null,
    thirdLevel: bookmarksStore.getCurrentThirdLevel || null,
    tags: [],
    isPinned: false,
    isFavorite: false,
  }
  newTag.value = ''
}

// 监听 bookmark 变化，初始化表单
watch(
  () => props.bookmark,
  (newBookmark) => {
    if (newBookmark) {
      formData.value = {
        title: newBookmark.title || newBookmark.name || '',
        url: newBookmark.url || '',
        description: newBookmark.description || '',
        favIconUrl: newBookmark.favIconUrl || '',
        firstLevel: newBookmark.firstLevel || null,
        secondLevel: newBookmark.secondLevel || null,
        thirdLevel: newBookmark.thirdLevel || null,
        tags: newBookmark.tags ? [...newBookmark.tags] : [],
        isPinned: newBookmark.isPinned || false,
        isFavorite: newBookmark.isFavorite || false,
      }
    } else {
      resetForm()
    }
    errors.value = {}
  },
  { immediate: true }
)

// 分类变化处理
const handleFirstLevelChange = () => {
  formData.value.secondLevel = null
  formData.value.thirdLevel = null
}

const handleSecondLevelChange = () => {
  formData.value.thirdLevel = null
}

// URL 失焦处理
const handleUrlBlur = () => {
  if (formData.value.url) {
    formData.value.url = formatUrl(formData.value.url)
    if (!formData.value.favIconUrl) {
      fetchFavIcon()
    }
  }
}

// 获取网站图标
const fetchFavIcon = async () => {
  if (!formData.value.url || !isValidUrl(formData.value.url)) {
    toast.add({
      severity: 'warn',
      summary: '提示',
      detail: '请先输入有效的网址',
      life: 2000,
    })
    return
  }

  isFetchingIcon.value = true
  try {
    const iconUrl = getFavIconUrl(formData.value.url)
    formData.value.favIconUrl = iconUrl
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '获取失败',
      detail: '无法获取网站图标',
      life: 2000,
    })
  } finally {
    isFetchingIcon.value = false
  }
}

// 图标加载失败
const handleIconError = (event) => {
  event.target.src = defaultIcon
}

// 添加标签
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

// 移除标签
const removeTag = (index) => {
  formData.value.tags.splice(index, 1)
}

// 清除错误
const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

// 验证表单
const validateForm = () => {
  errors.value = {}

  if (!formData.value.title.trim()) {
    errors.value.title = '请输入书签名称'
  }

  if (!formData.value.url.trim()) {
    errors.value.url = '请输入网址'
  } else if (!isValidUrl(formData.value.url)) {
    errors.value.url = '请输入有效的网址'
  }

  if (!formData.value.firstLevel) {
    errors.value.firstLevel = '请选择分类'
  }

  return Object.keys(errors.value).length === 0
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSaving.value = true
  try {
    const bookmarkData = {
      title: formData.value.title.trim(),
      url: formData.value.url.trim(),
      description: formData.value.description.trim(),
      favIconUrl: formData.value.favIconUrl || getFavIconUrl(formData.value.url),
      firstLevel: formData.value.firstLevel,
      secondLevel: formData.value.secondLevel || null,
      thirdLevel: formData.value.thirdLevel || null,
      tags: formData.value.tags,
      isPinned: formData.value.isPinned,
      isFavorite: formData.value.isFavorite,
    }

    if (isEditMode.value) {
      await bookmarksStore.updateBookmark(props.bookmark.id, bookmarkData)
      toast.add({
        severity: 'success',
        summary: '保存成功',
        detail: '书签已更新',
        life: 2000,
      })
    } else {
      // addBookmark 需要两个参数：categoryPath 和 bookmark
      const categoryPath = {
        first: bookmarkData.firstLevel,
        second: bookmarkData.secondLevel,
        third: bookmarkData.thirdLevel,
      }
      await bookmarksStore.addBookmark(categoryPath, bookmarkData)
      toast.add({
        severity: 'success',
        summary: '添加成功',
        detail: '书签已添加',
        life: 2000,
      })
    }

    emit('saved')
    handleClose()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message || '保存书签失败',
      life: 3000,
    })
  } finally {
    isSaving.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
  setTimeout(() => {
    resetForm()
    errors.value = {}
  }, 300)
}
</script>

<style scoped>
.bookmark-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
}

.url-input-group :deep(.p-inputtext) {
  flex: 1;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.favicon-img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  flex-shrink: 0;
}

.icon-url-input {
  flex: 1;
}

.category-selectors {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-selectors :deep(.p-dropdown) {
  width: 100%;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  min-height: 42px;
}

.tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  background: transparent;
}

.tag-input:focus {
  outline: none;
  box-shadow: none;
}

.quick-options {
  display: flex;
  gap: 1.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-item label {
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.p-error {
  color: #ef4444;
  font-size: 0.8125rem;
}
</style>
