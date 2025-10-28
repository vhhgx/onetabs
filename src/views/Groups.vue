<template>
  <div class="groups-view">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h2 class="title">标签组工作空间</h2>
      <div class="actions">
        <Button
          label="创建标签组"
          icon="pi pi-plus"
          severity="success"
          @click="showCreateGroupDialog = true"
        />
        <Button
          label="窗口管理"
          icon="pi pi-window-maximize"
          severity="info"
          @click="showWindowManager = true"
        />
      </div>
    </div>

    <!-- 看板布局 -->
    <div class="kanban-container">
      <div v-if="groupsStore.tabGroups.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <h3>暂无标签组</h3>
        <p>点击"创建标签组"按钮开始组织你的标签</p>
      </div>

      <div v-else class="kanban-grid">
        <div
          v-for="group in groupsStore.tabGroups"
          :key="group.id"
          class="kanban-card"
        >
          <!-- 卡片头部 -->
          <div class="card-header" :style="{ borderLeftColor: group.color }">
            <div class="header-left">
              <div class="color-badge" :style="{ backgroundColor: group.color }"></div>
              <h3 class="group-name">{{ group.name }}</h3>
            </div>
            <div class="header-actions">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                @click="editGroup(group)"
              />
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                size="small"
                @click="showGroupMenu($event, group)"
              />
            </div>
          </div>

          <!-- 标签列表 -->
          <div class="card-body">
            <div v-if="group.tabs.length === 0" class="empty-tabs">
              <p>暂无标签</p>
            </div>
            <div v-else class="tabs-list">
              <div
                v-for="tab in group.tabs"
                :key="tab.id"
                class="tab-item"
                @click="openTab(tab.url)"
              >
                <img
                  :src="tab.favIconUrl || '/icons/icon16.png'"
                  alt=""
                  class="tab-icon"
                  @error="handleIconError"
                />
                <span class="tab-title">{{ tab.title }}</span>
                <Button
                  icon="pi pi-times"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  class="remove-btn"
                  @click.stop="removeTab(group.id, tab.id)"
                />
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <Button
              label="添加标签"
              icon="pi pi-plus"
              text
              size="small"
              class="add-tab-btn"
              @click="showAddTabDialog(group)"
            />
            <span class="tab-count">{{ group.tabs.length }} 个标签</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建标签组对话框 -->
    <Dialog
      v-model:visible="showCreateGroupDialog"
      modal
      header="创建新标签组"
      :style="{ width: '450px' }"
    >
      <div class="create-form">
        <div class="form-field">
          <label class="field-label">标签组名称</label>
          <InputText
            v-model="newGroup.name"
            placeholder="输入标签组名称"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label class="field-label">选择颜色</label>
          <div class="color-picker">
            <div
              v-for="color in colorOptions"
              :key="color.value"
              class="color-option"
              :class="{ selected: newGroup.color === color.value }"
              :style="{ backgroundColor: color.value }"
              :title="color.label"
              @click="newGroup.color = color.value"
            >
              <i v-if="newGroup.color === color.value" class="pi pi-check"></i>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="取消"
          severity="secondary"
          outlined
          @click="showCreateGroupDialog = false"
        />
        <Button
          label="创建"
          severity="success"
          :disabled="!newGroup.name.trim()"
          @click="handleCreateGroup"
        />
      </template>
    </Dialog>

    <!-- 编辑标签组对话框 -->
    <Dialog
      v-model:visible="showEditGroupDialog"
      modal
      header="编辑标签组"
      :style="{ width: '450px' }"
    >
      <div v-if="editingGroup" class="create-form">
        <div class="form-field">
          <label class="field-label">标签组名称</label>
          <InputText
            v-model="editingGroup.name"
            placeholder="输入标签组名称"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label class="field-label">选择颜色</label>
          <div class="color-picker">
            <div
              v-for="color in colorOptions"
              :key="color.value"
              class="color-option"
              :class="{ selected: editingGroup.color === color.value }"
              :style="{ backgroundColor: color.value }"
              :title="color.label"
              @click="editingGroup.color = color.value"
            >
              <i v-if="editingGroup.color === color.value" class="pi pi-check"></i>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="取消"
          severity="secondary"
          outlined
          @click="showEditGroupDialog = false"
        />
        <Button
          label="保存"
          severity="success"
          :disabled="!editingGroup?.name.trim()"
          @click="handleUpdateGroup"
        />
      </template>
    </Dialog>

    <!-- 右键菜单 -->
    <ContextMenu
      v-model:visible="contextMenuVisible"
      :position="contextMenuPosition"
      :items="contextMenuItems"
      @select="handleMenuSelect"
    />

    <!-- 窗口管理器（待实现） -->
    <div v-if="showWindowManager" class="window-manager-placeholder">
      窗口管理器（待实现）
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGroupsStore } from '@/stores/groupsStore'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ContextMenu from '@/components/ContextMenu.vue'

const groupsStore = useGroupsStore()

const showCreateGroupDialog = ref(false)
const showEditGroupDialog = ref(false)
const showWindowManager = ref(false)
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
const contextMenuItems = ref([])
const currentGroup = ref(null)
const editingGroup = ref(null)

const newGroup = reactive({
  name: '',
  color: '#3B82F6'
})

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

onMounted(async () => {
  await groupsStore.loadGroups()
})

const handleCreateGroup = async () => {
  try {
    await groupsStore.createTabGroup(newGroup.name, newGroup.color, [])
    showCreateGroupDialog.value = false
    newGroup.name = ''
    newGroup.color = '#3B82F6'
  } catch (error) {
    console.error('创建标签组失败:', error)
  }
}

const editGroup = (group) => {
  editingGroup.value = { ...group }
  showEditGroupDialog.value = true
}

const handleUpdateGroup = async () => {
  try {
    await groupsStore.updateTabGroup(editingGroup.value.id, {
      name: editingGroup.value.name,
      color: editingGroup.value.color
    })
    showEditGroupDialog.value = false
    editingGroup.value = null
  } catch (error) {
    console.error('更新标签组失败:', error)
  }
}

const showGroupMenu = (event, group) => {
  event.preventDefault()
  currentGroup.value = group

  const refCount = groupsStore.getTabGroupRefCount(group.id)

  contextMenuItems.value = [
    { id: 'edit', label: '编辑', icon: 'pi pi-pencil' },
    { id: 'divider1', divider: true },
    { id: 'delete', label: '删除', icon: 'pi pi-trash', danger: true, disabled: refCount > 0 }
  ]

  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuVisible.value = true
}

const handleMenuSelect = async (item) => {
  if (!currentGroup.value) return

  switch (item.id) {
    case 'edit':
      editGroup(currentGroup.value)
      break
    case 'delete':
      await handleDeleteGroup(currentGroup.value.id)
      break
  }

  currentGroup.value = null
}

const handleDeleteGroup = async (groupId) => {
  if (!confirm('确定要删除这个标签组吗?')) return

  try {
    await groupsStore.deleteTabGroup(groupId)
  } catch (error) {
    alert(error.message)
  }
}

const removeTab = async (groupId, tabId) => {
  try {
    await groupsStore.removeTabFromGroup(groupId, tabId)
  } catch (error) {
    console.error('删除标签失败:', error)
  }
}

const openTab = (url) => {
  if (chrome.tabs) {
    chrome.tabs.create({ url })
  } else {
    window.open(url, '_blank')
  }
}

const handleIconError = (e) => {
  e.target.src = '/icons/icon16.png'
}

const showAddTabDialog = (group) => {
  // 待实现: 添加标签对话框
  console.log('添加标签到:', group.name)
}
</script>

<style scoped lang="scss">
.groups-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  background: #f9fafb;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #111827;
  }

  .actions {
    display: flex;
    gap: 12px;
  }
}

.kanban-container {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;

  i {
    font-size: 64px;
    color: #d1d5db;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 20px;
    color: #6b7280;
    margin: 0 0 8px 0;
  }

  p {
    color: #9ca3af;
    margin: 0;
  }
}

.kanban-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding-bottom: 24px;
}

.kanban-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  border-left: 4px solid;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .color-badge {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .group-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }
}

.card-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  max-height: 400px;
}

.empty-tabs {
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
  font-size: 14px;
}

.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: #f9fafb;

    .remove-btn {
      opacity: 1;
    }
  }

  .tab-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tab-title {
    flex: 1;
    font-size: 14px;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-btn {
    opacity: 0;
    transition: opacity 0.15s;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;

  .tab-count {
    font-size: 13px;
    color: #6b7280;
  }
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .field-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.color-option {
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 3px solid transparent;

  &:hover {
    transform: scale(1.05);
  }

  &.selected {
    border-color: #111827;
  }

  i {
    color: white;
    font-size: 16px;
  }
}

.window-manager-placeholder {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  font-size: 18px;
  color: #6b7280;
}
</style>
