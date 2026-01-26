<template>
  <div v-if="currentFirstLevel" class="category-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">分类导航</h3>
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开' : '收起'">
        <i :class="isCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"></i>
      </button>
    </div>

    <div v-if="!isCollapsed" class="sidebar-content">
      <!-- 二级分类列表 -->
      <div class="category-tree">
        <div
          v-for="secondLevel in secondLevelCategories"
          :key="secondLevel.id"
          class="category-node"
        >
          <!-- 二级分类项 -->
          <div
            :class="['category-item', 'level-2', { active: currentSecondLevel === secondLevel.id }]"
            @click="selectSecondLevel(secondLevel.id)"
            @contextmenu.prevent="(e) => handleContextMenu(e, secondLevel, 2)"
          >
            <button
              v-if="hasThirdLevel(secondLevel.id)"
              class="expand-btn"
              @click.stop="toggleExpand(secondLevel.id)"
            >
              <i :class="expandedNodes.has(secondLevel.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
            </button>
            <i v-if="secondLevel.icon" :class="`${secondLevel.icon} category-icon`"></i>
            <span class="category-name">{{ secondLevel.title }}</span>
            <span class="bookmark-count">{{ getSecondLevelCount(secondLevel.id) }}</span>
          </div>

          <!-- 三级分类列表 -->
          <div
            v-if="expandedNodes.has(secondLevel.id)"
            class="third-level-container"
          >
            <div
              v-for="thirdLevel in getThirdLevelCategories(secondLevel.id)"
              :key="thirdLevel.id"
              :class="['category-item', 'level-3', { active: currentThirdLevel === thirdLevel.id }]"
              @click="selectThirdLevel(thirdLevel.id)"
              @contextmenu.prevent="(e) => handleContextMenu(e, thirdLevel, 3)"
            >
              <i v-if="thirdLevel.icon" :class="`${thirdLevel.icon} category-icon`"></i>
              <span class="category-name">{{ thirdLevel.title }}</span>
              <span class="bookmark-count">{{ getThirdLevelCount(thirdLevel.id) }}</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="secondLevelCategories.length === 0" class="empty-state">
          <i class="pi pi-folder-open"></i>
          <p>暂无子分类</p>
          <button class="add-category-btn" @click="addSecondLevel">
            <i class="pi pi-plus"></i>
            添加二级分类
          </button>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="sidebar-footer">
        <button class="action-btn" @click="addSecondLevel" title="添加二级分类">
          <i class="pi pi-plus"></i>
          <span>添加子分类</span>
        </button>
      </div>
    </div>

    <!-- 折叠状态 -->
    <div v-else class="collapsed-state">
      <div
        v-for="secondLevel in secondLevelCategories.slice(0, 5)"
        :key="secondLevel.id"
        :class="['collapsed-item', { active: currentSecondLevel === secondLevel.id }]"
        @click="selectSecondLevel(secondLevel.id)"
        :title="secondLevel.title"
      >
        <i v-if="secondLevel.icon" :class="`${secondLevel.icon}`"></i>
        <span v-else>{{ secondLevel.title.charAt(0) }}</span>
      </div>
      <div v-if="secondLevelCategories.length > 5" class="collapsed-item more">
        <span>+{{ secondLevelCategories.length - 5 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBookmarksStore } from '../stores/bookmarksStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useContextMenu } from '../composables/useContextMenu'

const bookmarksStore = useBookmarksStore()
const toast = useToast()
const confirm = useConfirm()
const contextMenu = useContextMenu()

const emit = defineEmits(['add-category', 'edit-category'])

const isCollapsed = ref(false)
const expandedNodes = ref(new Set())

// 当前选中的分类
const currentFirstLevel = computed(() => bookmarksStore.getCurrentFirstLevel)
const currentSecondLevel = computed(() => bookmarksStore.getCurrentSecondLevel)
const currentThirdLevel = computed(() => bookmarksStore.getCurrentThirdLevel)

// 二级分类列表
const secondLevelCategories = computed(() => {
  if (!currentFirstLevel.value) return []
  return bookmarksStore.getSecondLevelCategories(currentFirstLevel.value)
})

// 获取三级分类
const getThirdLevelCategories = (secondLevelId) => {
  return bookmarksStore.getThirdLevelCategories(currentFirstLevel.value, secondLevelId)
}

// 判断是否有三级分类
const hasThirdLevel = (secondLevelId) => {
  const thirdLevels = getThirdLevelCategories(secondLevelId)
  return thirdLevels && thirdLevels.length > 0
}

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 切换展开节点
const toggleExpand = (nodeId) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

// 选择二级分类
const selectSecondLevel = (categoryId) => {
  bookmarksStore.setCurrentSecondLevel(categoryId)
  bookmarksStore.setCurrentThirdLevel(null)
}

// 选择三级分类
const selectThirdLevel = (categoryId) => {
  bookmarksStore.setCurrentThirdLevel(categoryId)
}

// 获取书签数量
const getSecondLevelCount = (secondLevelId) => {
  const bookmarks = bookmarksStore.getBookmarks({
    firstLevel: currentFirstLevel.value,
    secondLevel: secondLevelId,
  })
  return bookmarks.length
}

const getThirdLevelCount = (thirdLevelId) => {
  const bookmarks = bookmarksStore.getBookmarks({
    firstLevel: currentFirstLevel.value,
    secondLevel: currentSecondLevel.value,
    thirdLevel: thirdLevelId,
  })
  return bookmarks.length
}

// 添加二级分类
const addSecondLevel = () => {
  emit('add-category', { level: 2, parentId: currentFirstLevel.value })
}

// 处理右键菜单
const handleContextMenu = (event, category, level) => {
  const menuItems = [
    {
      label: '编辑分类',
      icon: 'pi pi-pencil',
      command: () => {
        emit('edit-category', { category, level })
      },
    },
  ]

  // 如果是二级分类，可以添加三级分类
  if (level === 2) {
    menuItems.push({
      label: '添加子分类',
      icon: 'pi pi-plus',
      command: () => {
        emit('add-category', { level: 3, parentId: category.id })
      },
    })
  }

  menuItems.push(
    {
      separator: true,
    },
    {
      label: '删除分类',
      icon: 'pi pi-trash',
      command: () => deleteCategory(category, level),
    }
  )

  contextMenu.showMenu(event, menuItems)
}

// 删除分类
const deleteCategory = (category, level) => {
  const countGetter = level === 2 ? getSecondLevelCount : getThirdLevelCount
  const bookmarkCount = countGetter(category.id)
  const message =
    bookmarkCount > 0
      ? `该分类下有 ${bookmarkCount} 个书签，删除后书签也会被删除。确定要删除 "${category.title}" 吗？`
      : `确定要删除分类 "${category.title}" 吗？`

  confirm.require({
    message,
    header: '删除分类',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        if (level === 2) {
          await bookmarksStore.deleteSecondLevelCategory(currentFirstLevel.value, category.id)
        } else {
          await bookmarksStore.deleteThirdLevelCategory(
            currentFirstLevel.value,
            currentSecondLevel.value,
            category.id
          )
        }
        toast.add({
          severity: 'success',
          summary: '删除成功',
          detail: '分类已删除',
          life: 2000,
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: '删除失败',
          detail: error.message || '无法删除分类',
          life: 3000,
        })
      }
    },
  })
}
</script>

<style scoped>
.category-sidebar {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.category-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.category-tree::-webkit-scrollbar {
  width: 6px;
}

.category-tree::-webkit-scrollbar-track {
  background: transparent;
}

.category-tree::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.category-node {
  margin-bottom: 0.25rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: var(--bg-primary);
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-item:hover {
  border-color: var(--border-primary);
  background: var(--bg-hover);
  color: var(--text-primary);
}

.category-item.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.category-item.level-3 {
  margin-left: 1.5rem;
  font-size: 0.8125rem;
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.category-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.375rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.category-item.active .bookmark-count {
  background: rgba(255, 255, 255, 0.25);
}

.third-level-container {
  margin-top: 0.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 2rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.add-category-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-category-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--border-primary);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem;
  background: var(--bg-primary);
  border: 1px dashed var(--border-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  border-style: solid;
  color: white;
}

/* 折叠状态 */
.collapsed-state {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.collapsed-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapsed-item:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.collapsed-item.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.collapsed-item.more {
  font-size: 0.75rem;
  font-weight: 600;
  cursor: default;
}

/* 响应式 */
@media (max-width: 768px) {
  .category-sidebar {
    width: 100%;
  }

  .category-item.level-3 {
    margin-left: 1rem;
  }
}
</style>
