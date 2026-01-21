<template>
  <Dialog
    :visible="visible"
    :header="dialogTitle"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '450px' }"
    @update:visible="handleClose"
  >
    <div class="category-dialog-content">
      <!-- 名称 -->
      <div class="form-field">
        <label class="field-label">
          <span>分类名称</span>
          <span class="required">*</span>
        </label>
        <InputText
          v-model="formData.name"
          placeholder="请输入分类名称"
          :class="{ 'p-invalid': errors.name }"
          @input="clearError('name')"
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <!-- 父级分类（仅二级和三级） -->
      <div v-if="categoryLevel > 1" class="form-field">
        <label class="field-label">
          <span>{{ categoryLevel === 2 ? '一级分类' : '二级分类' }}</span>
          <span class="required">*</span>
        </label>
        <Dropdown
          v-model="formData.parentId"
          :options="parentCategories"
          optionLabel="name"
          optionValue="id"
          :placeholder="`选择${categoryLevel === 2 ? '一级' : '二级'}分类`"
          :class="{ 'p-invalid': errors.parentId }"
          :disabled="!!presetParentId"
          @change="clearError('parentId')"
        />
        <small v-if="errors.parentId" class="p-error">{{ errors.parentId }}</small>
      </div>

      <!-- 图标选择 -->
      <div class="form-field">
        <label class="field-label">图标</label>
        <div class="icon-selector">
          <div class="selected-icon">
            <i v-if="formData.icon" :class="`${formData.icon} selected-icon-display`"></i>
            <span v-else class="no-icon">未选择</span>
          </div>
          <div class="icon-grid">
            <div
              v-for="icon in iconOptions"
              :key="icon"
              :class="['icon-option', { active: formData.icon === icon }]"
              @click="selectIcon(icon)"
            >
              <i :class="icon"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 颜色选择 -->
      <div class="form-field">
        <label class="field-label">主题色</label>
        <div class="color-selector">
          <div
            v-for="color in colorOptions"
            :key="color.value"
            :class="['color-option', { active: formData.color === color.value }]"
            :style="{ backgroundColor: color.value }"
            :title="color.name"
            @click="selectColor(color.value)"
          >
            <i v-if="formData.color === color.value" class="pi pi-check"></i>
          </div>
          <div class="custom-color">
            <input
              type="color"
              v-model="formData.color"
              class="color-picker"
              title="自定义颜色"
            />
          </div>
        </div>
      </div>

      <!-- 描述 -->
      <div class="form-field">
        <label class="field-label">描述</label>
        <Textarea
          v-model="formData.description"
          placeholder="可选，添加分类描述"
          :rows="2"
          :autoResize="true"
        />
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
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'

const bookmarksStore = useBookmarksStore()
const toast = useToast()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  category: {
    type: Object,
    default: null,
  },
  level: {
    type: Number,
    default: 1,
    validator: (value) => [1, 2, 3].includes(value),
  },
  parentId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'saved'])

const isSaving = ref(false)
const errors = ref({})

// 图标选项
const iconOptions = [
  'pi pi-bookmark',
  'pi pi-star',
  'pi pi-heart',
  'pi pi-folder',
  'pi pi-briefcase',
  'pi pi-inbox',
  'pi pi-shopping-cart',
  'pi pi-book',
  'pi pi-home',
  'pi pi-globe',
  'pi pi-code',
  'pi pi-desktop',
  'pi pi-mobile',
  'pi pi-tablet',
  'pi pi-camera',
  'pi pi-image',
  'pi pi-video',
  'pi pi-music',
  'pi pi-microphone',
  'pi pi-volume-up',
  'pi pi-phone',
  'pi pi-envelope',
  'pi pi-comment',
  'pi pi-users',
  'pi pi-user',
  'pi pi-calendar',
  'pi pi-clock',
  'pi pi-map-marker',
  'pi pi-compass',
  'pi pi-chart-line',
  'pi pi-chart-bar',
  'pi pi-wallet',
  'pi pi-dollar',
  'pi pi-percentage',
  'pi pi-credit-card',
  'pi pi-shopping-bag',
  'pi pi-gift',
  'pi pi-trophy',
  'pi pi-flag',
  'pi pi-ticket',
  'pi pi-wrench',
  'pi pi-cog',
  'pi pi-shield',
  'pi pi-key',
  'pi pi-cloud',
  'pi pi-database',
  'pi pi-server',
  'pi pi-sitemap',
  'pi pi-lightbulb',
]

// 颜色选项
const colorOptions = [
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '粉色', value: '#ec4899' },
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '青色', value: '#06b6d4' },
  { name: '靛蓝', value: '#6366f1' },
  { name: '玫红', value: '#f43f5e' },
  { name: '石灰色', value: '#84cc16' },
  { name: '天蓝色', value: '#0ea5e9' },
]

// 表单数据
const formData = ref({
  name: '',
  parentId: null,
  icon: '',
  color: '#3b82f6',
  description: '',
})

// 计算属性
const isEditMode = computed(() => !!props.category)
const categoryLevel = computed(() => props.level)
const presetParentId = computed(() => props.parentId)

const dialogTitle = computed(() => {
  const levelText = ['一', '二', '三'][categoryLevel.value - 1]
  return isEditMode.value ? `编辑${levelText}级分类` : `添加${levelText}级分类`
})

const parentCategories = computed(() => {
  if (categoryLevel.value === 2) {
    return bookmarksStore.getFirstLevelCategories
  } else if (categoryLevel.value === 3) {
    const firstLevel = presetParentId.value || bookmarksStore.getCurrentFirstLevel
    if (!firstLevel) return []
    return bookmarksStore.getSecondLevelCategories(firstLevel)
  }
  return []
})

// 监听 category 变化
watch(
  () => [props.category, props.visible],
  ([newCategory, isVisible]) => {
    if (isVisible) {
      if (newCategory) {
        formData.value = {
          name: newCategory.name || '',
          parentId: newCategory.parentId || presetParentId.value || null,
          icon: newCategory.icon || '',
          color: newCategory.color || '#3b82f6',
          description: newCategory.description || '',
        }
      } else {
        resetForm()
      }
      errors.value = {}
    }
  },
  { immediate: true }
)

// 重置表单
const resetForm = () => {
  const defaultParentId =
    presetParentId.value ||
    (categoryLevel.value === 2 ? bookmarksStore.getCurrentFirstLevel : null) ||
    (categoryLevel.value === 3 ? bookmarksStore.getCurrentSecondLevel : null)

  formData.value = {
    name: '',
    parentId: defaultParentId,
    icon: '',
    color: '#3b82f6',
    description: '',
  }
}

// 选择图标
const selectIcon = (icon) => {
  formData.value.icon = formData.value.icon === icon ? '' : icon
}

// 选择颜色
const selectColor = (color) => {
  formData.value.color = color
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

  if (!formData.value.name.trim()) {
    errors.value.name = '请输入分类名称'
  }

  if (categoryLevel.value > 1 && !formData.value.parentId) {
    errors.value.parentId = '请选择父级分类'
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
    const categoryData = {
      name: formData.value.name.trim(),
      icon: formData.value.icon,
      color: formData.value.color,
      description: formData.value.description.trim(),
    }

    if (isEditMode.value) {
      // 编辑模式
      if (categoryLevel.value === 1) {
        await bookmarksStore.updateFirstLevelCategory(props.category.id, categoryData)
      } else if (categoryLevel.value === 2) {
        await bookmarksStore.updateSecondLevelCategory(
          formData.value.parentId,
          props.category.id,
          categoryData
        )
      } else {
        const firstLevel = bookmarksStore.getCurrentFirstLevel
        await bookmarksStore.updateThirdLevelCategory(
          firstLevel,
          formData.value.parentId,
          props.category.id,
          categoryData
        )
      }
      toast.add({
        severity: 'success',
        summary: '保存成功',
        detail: '分类已更新',
        life: 2000,
      })
    } else {
      // 新增模式
      if (categoryLevel.value === 1) {
        await bookmarksStore.addFirstLevelCategory(categoryData)
      } else if (categoryLevel.value === 2) {
        await bookmarksStore.addSecondLevelCategory(formData.value.parentId, categoryData)
      } else {
        const firstLevel = bookmarksStore.getCurrentFirstLevel
        await bookmarksStore.addThirdLevelCategory(
          firstLevel,
          formData.value.parentId,
          categoryData
        )
      }
      toast.add({
        severity: 'success',
        summary: '添加成功',
        detail: '分类已添加',
        life: 2000,
      })
    }

    emit('saved')
    handleClose()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message || '保存分类失败',
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
.category-dialog-content {
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

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selected-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
}

.selected-icon-display {
  font-size: 2rem;
  color: var(--primary-color);
}

.no-icon {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
}

.icon-grid::-webkit-scrollbar {
  width: 6px;
}

.icon-grid::-webkit-scrollbar-track {
  background: transparent;
}

.icon-grid::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-option:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: scale(1.1);
}

.icon-option.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.color-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
}

.color-option {
  position: relative;
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-option.active {
  border-color: var(--text-primary);
}

.color-option i {
  color: white;
  font-size: 1.25rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.custom-color {
  position: relative;
  width: 40px;
  height: 40px;
  border: 2px dashed var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-color:hover {
  border-color: var(--primary-color);
  transform: scale(1.1);
}

.color-picker {
  position: absolute;
  top: -4px;
  left: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border: none;
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
