<template>
  <div class="category-tabs">
    <div class="tabs-container">
      <!-- 全部标签 -->
      <div
        :class="['tab-item', 'all-tab', { active: !currentFirstLevel }]"
        @click="selectCategory(null)"
        @contextmenu.prevent="(e) => handleContextMenu(e, null)"
      >
        <i class="pi pi-th-large tab-icon"></i>
        <span class="tab-name">全部</span>
        <span class="tab-count">{{ totalBookmarks }}</span>
      </div>

      <!-- 分类标签 -->
      <div
        v-for="category in firstLevelCategories"
        :key="category.id"
        :class="['tab-item', { active: currentFirstLevel === category.id }]"
        :style="{ '--category-color': category.color || '#3b82f6' }"
        @click="selectCategory(category.id)"
        @contextmenu.prevent="(e) => handleContextMenu(e, category)"
      >
        <i v-if="category.icon" :class="`${category.icon} tab-icon`"></i>
        <span class="tab-name">{{ category.name }}</span>
        <span class="tab-count">{{ getCategoryBookmarkCount(category.id) }}</span>
      </div>

      <!-- 添加新分类按钮 -->
      <div class="tab-item add-tab" @click="addNewCategory" title="添加新分类">
        <i class="pi pi-plus"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBookmarksStore } from '../stores/bookmarksStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useContextMenu } from '../composables/useContextMenu'

const bookmarksStore = useBookmarksStore()
const toast = useToast()
const confirm = useConfirm()
const contextMenu = useContextMenu()

const emit = defineEmits(['add-category', 'edit-category'])

// 获取当前一级分类
const currentFirstLevel = computed(() => bookmarksStore.getCurrentFirstLevel)

// 获取所有一级分类
const firstLevelCategories = computed(() => bookmarksStore.getFirstLevelCategories)

// 获取总书签数
const totalBookmarks = computed(() => bookmarksStore.getTotalBookmarksCount)

// 选择分类
const selectCategory = (categoryId) => {
  bookmarksStore.setCurrentFirstLevel(categoryId)
  // 重置二三级分类
  bookmarksStore.setCurrentSecondLevel(null)
  bookmarksStore.setCurrentThirdLevel(null)
}

// 获取分类下的书签数量
const getCategoryBookmarkCount = (categoryId) => {
  const bookmarks = bookmarksStore.getBookmarks({ first: categoryId })
  return bookmarks.length
}

// 添加新分类
const addNewCategory = () => {
  emit('add-category')
}

// 处理右键菜单
const handleContextMenu = (event, category) => {
  if (!category) {
    // 全部标签的右键菜单
    const menuItems = [
      {
        label: '刷新',
        icon: 'pi pi-refresh',
        command: () => {
          bookmarksStore.loadBookmarks()
          toast.add({
            severity: 'success',
            summary: '已刷新',
            detail: '书签列表已更新',
            life: 2000,
          })
        },
      },
    ]
    contextMenu.showMenu(event, menuItems)
    return
  }

  // 分类标签的右键菜单
  const menuItems = [
    {
      label: '编辑分类',
      icon: 'pi pi-pencil',
      command: () => {
        emit('edit-category', category)
      },
    },
    {
      separator: true,
    },
    {
      label: '删除分类',
      icon: 'pi pi-trash',
      command: () => deleteCategory(category),
    },
  ]

  contextMenu.showMenu(event, menuItems)
}

// 删除分类
const deleteCategory = (category) => {
  const bookmarkCount = getCategoryBookmarkCount(category.id)
  const message =
    bookmarkCount > 0
      ? `该分类下有 ${bookmarkCount} 个书签，删除后书签也会被删除。确定要删除 "${category.name}" 吗？`
      : `确定要删除分类 "${category.name}" 吗？`

  confirm.require({
    message,
    header: '删除分类',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bookmarksStore.deleteFirstLevelCategory(category.id)
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
.category-tabs {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem;
}

/* 隐藏滚动条但保持功能 */
.tabs-container::-webkit-scrollbar {
  height: 4px;
}

.tabs-container::-webkit-scrollbar-track {
  background: transparent;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 2px;
}

.tabs-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
}

.tab-item:hover {
  border-color: var(--category-color, var(--primary-color));
  color: var(--text-primary);
  transform: translateY(-1px);
}

.tab-item.active {
  background: var(--category-color, var(--primary-color));
  border-color: var(--category-color, var(--primary-color));
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tab-item.all-tab {
  --category-color: #6366f1;
}

.tab-icon {
  font-size: 1rem;
}

.tab-name {
  font-weight: 500;
}

.tab-count {
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
}

.tab-item.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
}

.tab-item.add-tab {
  min-width: 40px;
  padding: 0.625rem;
  justify-content: center;
  border-style: dashed;
}

.tab-item.add-tab:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  border-style: solid;
  color: white;
}

/* 响应式 */
@media (max-width: 768px) {
  .category-tabs {
    padding: 0.5rem;
  }

  .tabs-container {
    gap: 0.375rem;
    padding: 0.125rem;
  }

  .tab-item {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .tab-icon {
    font-size: 0.875rem;
  }

  .tab-count {
    min-width: 18px;
    height: 18px;
    font-size: 0.6875rem;
  }
}
</style>
