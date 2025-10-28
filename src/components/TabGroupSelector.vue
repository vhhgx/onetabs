<template>
  <Sidebar
    v-model:visible="isVisible"
    position="right"
    class="tab-group-selector"
    :style="{ width: '400px' }"
  >
    <template #header>
      <h3 class="text-lg font-semibold">选择标签组</h3>
    </template>

    <div class="selector-content">
      <!-- 搜索框 -->
      <div class="search-box mb-4">
        <InputText
          v-model="searchQuery"
          placeholder="搜索标签组..."
          class="w-full"
        >
          <template #prefix>
            <i class="pi pi-search"></i>
          </template>
        </InputText>
      </div>

      <!-- 创建新标签组 -->
      <div class="create-new mb-4">
        <Button
          label="创建新标签组"
          icon="pi pi-plus"
          severity="success"
          class="w-full"
          @click="showCreateDialog = true"
        />
      </div>

      <!-- 标签组列表 -->
      <div class="group-list">
        <div
          v-for="group in filteredGroups"
          :key="group.id"
          class="group-item"
          :class="{ selected: selectedGroupId === group.id }"
          @click="selectGroup(group.id)"
        >
          <div class="group-color" :style="{ backgroundColor: group.color }"></div>
          <div class="group-info">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-meta">
              <span class="tab-count">{{ group.tabs.length }} 个标签</span>
              <span class="created-date">{{ formatDate(group.createdAt) }}</span>
            </div>
          </div>
          <i v-if="selectedGroupId === group.id" class="pi pi-check text-green-500"></i>
        </div>

        <div v-if="filteredGroups.length === 0" class="empty-state">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-500">暂无标签组</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button
          label="取消"
          severity="secondary"
          outlined
          class="flex-1"
          @click="handleCancel"
        />
        <Button
          label="确定"
          severity="primary"
          class="flex-1"
          :disabled="!selectedGroupId"
          @click="handleConfirm"
        />
      </div>
    </template>
  </Sidebar>

  <!-- 创建标签组对话框 -->
  <Dialog
    v-model:visible="showCreateDialog"
    modal
    header="创建新标签组"
    :style="{ width: '400px' }"
  >
    <div class="create-form">
      <div class="form-field mb-4">
        <label class="block mb-2 font-medium">标签组名称</label>
        <InputText
          v-model="newGroupName"
          placeholder="输入标签组名称"
          class="w-full"
        />
      </div>

      <div class="form-field mb-4">
        <label class="block mb-2 font-medium">选择颜色</label>
        <div class="color-picker">
          <div
            v-for="color in colorOptions"
            :key="color.value"
            class="color-option"
            :class="{ selected: newGroupColor === color.value }"
            :style="{ backgroundColor: color.value }"
            @click="newGroupColor = color.value"
          >
            <i v-if="newGroupColor === color.value" class="pi pi-check text-white"></i>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button
          label="取消"
          severity="secondary"
          outlined
          @click="showCreateDialog = false"
        />
        <Button
          label="创建"
          severity="primary"
          :disabled="!newGroupName.trim()"
          @click="handleCreateGroup"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGroupsStore } from '@/stores/groupsStore'
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  tabData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const groupsStore = useGroupsStore()

const isVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const searchQuery = ref('')
const selectedGroupId = ref(null)
const showCreateDialog = ref(false)
const newGroupName = ref('')
const newGroupColor = ref('#3B82F6')

const colorOptions = [
  { label: '蓝色', value: '#3B82F6' },
  { label: '红色', value: '#EF4444' },
  { label: '绿色', value: '#10B981' },
  { label: '橙色', value: '#F59E0B' },
  { label: '紫色', value: '#8B5CF6' },
  { label: '粉色', value: '#EC4899' },
  { label: '青色', value: '#06B6D4' },
  { label: '靛蓝', value: '#6366F1' }
]

const filteredGroups = computed(() => {
  const groups = groupsStore.getTabGroups
  if (!searchQuery.value.trim()) {
    return groups
  }
  const query = searchQuery.value.toLowerCase()
  return groups.filter(group =>
    group.name.toLowerCase().includes(query)
  )
})

const selectGroup = (groupId) => {
  selectedGroupId.value = groupId
}

const handleCancel = () => {
  isVisible.value = false
  selectedGroupId.value = null
  searchQuery.value = ''
}

const handleConfirm = () => {
  if (!selectedGroupId.value) return

  emit('confirm', {
    groupId: selectedGroupId.value,
    tabData: props.tabData
  })

  handleCancel()
}

const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) return

  try {
    const newGroup = await groupsStore.createTabGroup(
      newGroupName.value.trim(),
      newGroupColor.value,
      []
    )

    showCreateDialog.value = false
    newGroupName.value = ''
    newGroupColor.value = '#3B82F6'

    // 自动选择新创建的标签组
    selectedGroupId.value = newGroup.id
  } catch (error) {
    console.error('创建标签组失败:', error)
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    selectedGroupId.value = null
    searchQuery.value = ''
  }
})
</script>

<style scoped>
.selector-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.group-list {
  flex: 1;
  overflow-y: auto;
}

.group-item {
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

.group-item:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.group-item.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.group-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.color-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #111827;
}
</style>
