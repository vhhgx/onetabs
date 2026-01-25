<template>
  <div class="bookmarks-view">
    <!-- 页面头部 -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="pi pi-bookmark"></i>
          书签导航
        </h1>
        <div class="stats-bar">
          <span class="stat-badge">
            <i class="pi pi-bookmark"></i>
            {{ totalBookmarksCount }} 个书签
          </span>
          <span class="stat-badge">
            <i class="pi pi-folder"></i>
            {{ firstLevelCategories.length }} 个分类
          </span>
        </div>
      </div>
      <div class="header-right">
        <Button icon="pi pi-download" label="导入书签" outlined @click="showImportDialog = true" />
        <Button icon="pi pi-plus" label="添加书签" @click="showAddBookmarkDialog" />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="bookmarksStore.isLoading" class="loading-container">
      <ProgressSpinner />
      <p>正在加载书签数据...</p>
    </div>

    <!-- 书签内容 -->
    <div v-else class="bookmarks-content">
      <!-- 固定书签栏 -->
      <PinnedBookmarksBar :maxDisplay="8" />

      <!-- 一级分类标签 -->
      <CategoryTabs @add-category="handleAddCategory(1)" @edit-category="handleEditCategory" />

      <!-- 主要内容区域 -->
      <div class="main-content" :class="{ 'no-sidebar': !currentFirstLevel }">
        <!-- 侧边栏：二级/三级分类 -->
        <CategorySidebar
          v-if="currentFirstLevel"
          @add-category="handleAddCategory"
          @edit-category="handleEditCategory"
        />

        <!-- 书签列表区域 -->
        <div class="bookmarks-area">
          <!-- 当前路径面包屑 -->
          <div v-if="currentFirstLevel" class="breadcrumb">
            <span class="breadcrumb-item" @click="resetToFirstLevel">
              {{ getCurrentCategoryName(currentFirstLevel) }}
            </span>
            <template v-if="currentSecondLevel">
              <i class="pi pi-angle-right"></i>
              <span :class="['breadcrumb-item', { active: !currentThirdLevel }]" @click="resetToSecondLevel">
                {{ getCurrentCategoryName(currentSecondLevel, 2) }}
              </span>
            </template>
            <template v-if="currentThirdLevel">
              <i class="pi pi-angle-right"></i>
              <span class="breadcrumb-item active">
                {{ getCurrentCategoryName(currentThirdLevel, 3) }}
              </span>
            </template>
          </div>

          <!-- 搜索栏 -->
          <div class="search-section">
            <BookmarkSearchBar @search="handleSearchResults" @select="handleSearchSelect" @clear="handleSearchClear" />
          </div>

          <!-- 书签网格容器 -->
          <div class="bookmarks-grid-container">
            <!-- 书签网格 -->
            <div v-if="displayedBookmarks.length > 0" class="bookmarks-grid">
              <BookmarkCard
                v-for="bookmark in displayedBookmarks"
                :key="bookmark.id"
                :bookmark="bookmark"
                :showDescription="true"
                @click="openBookmark(bookmark)"
                @pin="togglePin(bookmark)"
                @favorite="toggleFavorite(bookmark)"
                @edit="handleEditBookmark(bookmark)"
                @delete="handleDeleteBookmark(bookmark)"
                @contextmenu="handleBookmarkContextMenu($event, bookmark)"
              />
            </div>

            <!-- 空状态 -->
            <EmptyState
              v-else
              icon="pi pi-inbox"
              title="暂无书签"
              :description="searchKeyword ? '没有找到匹配的书签' : '该分类下还没有书签'"
            >
              <Button v-if="!searchKeyword" label="添加书签" icon="pi pi-plus" @click="showAddBookmarkDialog" />
            </EmptyState>
          </div>
        </div>
      </div>
    </div>

    <!-- 书签编辑对话框 -->
    <BookmarkDialog v-model:visible="bookmarkDialogVisible" :bookmark="selectedBookmark" @saved="handleBookmarkSaved" />

    <!-- 分类编辑对话框 -->
    <CategoryDialog
      v-model:visible="categoryDialogVisible"
      :category="selectedCategory"
      :level="categoryLevel"
      :parentId="categoryParentId"
      @saved="handleCategorySaved"
    />

    <!-- 导入书签对话框 -->
    <ImportBookmarks v-model:show="showImportDialog" @imported="handleImported" />

    <!-- Toast 通知 -->
    <Toast />

    <!-- 确认对话框 -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBookmarksStore } from '../stores/bookmarksStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import PinnedBookmarksBar from '../components/PinnedBookmarksBar.vue'
import CategoryTabs from '../components/CategoryTabs.vue'
import CategorySidebar from '../components/CategorySidebar.vue'
import BookmarkCard from '../components/BookmarkCard.vue'
import BookmarkDialog from '../components/BookmarkDialog.vue'
import CategoryDialog from '../components/CategoryDialog.vue'
import ImportBookmarks from '../components/ImportBookmarks.vue'
import BookmarkSearchBar from '../components/BookmarkSearchBar.vue'
import EmptyState from '../components/EmptyState.vue'

const bookmarksStore = useBookmarksStore()
const toast = useToast()
const confirm = useConfirm()

// 状态
const searchKeyword = ref('')
const searchResults = ref(null)
const bookmarkDialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const showImportDialog = ref(false)
const selectedBookmark = ref(null)
const selectedCategory = ref(null)
const categoryLevel = ref(1)
const categoryParentId = ref(null)

// 计算属性
const firstLevelCategories = computed(() => bookmarksStore.getFirstLevelCategories)
const totalBookmarksCount = computed(() => bookmarksStore.getTotalBookmarksCount)
const currentFirstLevel = computed(() => {
  const value = bookmarksStore.getCurrentFirstLevel
  return value
})
const currentSecondLevel = computed(() => bookmarksStore.getCurrentSecondLevel)
const currentThirdLevel = computed(() => bookmarksStore.getCurrentThirdLevel)

// 显示的书签列表（根据当前分类和搜索）
const displayedBookmarks = computed(() => {
  // 如果有搜索结果，优先显示搜索结果
  if (searchResults.value) {
    return searchResults.value
  }

  let bookmarks = []

  if (currentFirstLevel.value) {
    // 选中了一级分类，按分类筛选
    bookmarks = bookmarksStore.getBookmarks({
      first: currentFirstLevel.value,
      second: currentSecondLevel.value || undefined,
      third: currentThirdLevel.value || undefined,
    })
  } else {
    // 选中"全部"，返回所有书签
    const allBookmarks = []
    bookmarksStore.bookmarks.forEach((category) => {
      const collectAllBookmarks = (cat) => {
        if (cat.bookmarks) {
          allBookmarks.push(...cat.bookmarks)
        }
        if (cat.children) {
          cat.children.forEach((child) => collectAllBookmarks(child))
        }
      }
      collectAllBookmarks(category)
    })
    bookmarks = allBookmarks
  }

  return bookmarks
})

// 获取当前分类名称
const getCurrentCategoryName = (categoryId, level = 1) => {
  if (!categoryId) return ''

  if (level === 1) {
    const category = firstLevelCategories.value.find((c) => c.id === categoryId)
    return category ? category.name : ''
  } else if (level === 2) {
    const secondLevels = bookmarksStore.getSecondLevelCategories(currentFirstLevel.value)
    const category = secondLevels.find((c) => c.id === categoryId)
    return category ? category.name : ''
  } else if (level === 3) {
    const thirdLevels = bookmarksStore.getThirdLevelCategories(currentFirstLevel.value, currentSecondLevel.value)
    const category = thirdLevels.find((c) => c.id === categoryId)
    return category ? category.name : ''
  }
  return ''
}

// 重置到一级分类
const resetToFirstLevel = () => {
  bookmarksStore.setCurrentSecondLevel(null)
  bookmarksStore.setCurrentThirdLevel(null)
}

// 重置到二级分类
const resetToSecondLevel = () => {
  bookmarksStore.setCurrentThirdLevel(null)
}

// 打开书签
const openBookmark = (bookmark) => {
  if (bookmark.url) {
    window.open(bookmark.url, '_blank')
    toast.add({
      severity: 'success',
      summary: '已打开',
      detail: bookmark.name,
      life: 2000,
    })
  }
}

// 切换固定状态
const togglePin = async (bookmark) => {
  try {
    if (bookmark.isPinned) {
      await bookmarksStore.unpinBookmark(bookmark.id)
      toast.add({
        severity: 'success',
        summary: '取消成功',
        detail: '已取消固定',
        life: 2000,
      })
    } else {
      await bookmarksStore.pinBookmark(bookmark)
      toast.add({
        severity: 'success',
        summary: '固定成功',
        detail: '书签已固定',
        life: 2000,
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message,
      life: 3000,
    })
  }
}

// 切换收藏状态
const toggleFavorite = async (bookmark) => {
  try {
    if (bookmark.isFavorite) {
      await bookmarksStore.unfavoriteBookmark(bookmark.id)
      toast.add({
        severity: 'success',
        summary: '取消成功',
        detail: '已取消收藏',
        life: 2000,
      })
    } else {
      await bookmarksStore.favoriteBookmark(bookmark.id)
      toast.add({
        severity: 'success',
        summary: '收藏成功',
        detail: '书签已收藏',
        life: 2000,
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message,
      life: 3000,
    })
  }
}

// 显示添加书签对话框
const showAddBookmarkDialog = () => {
  selectedBookmark.value = null
  bookmarkDialogVisible.value = true
}

// 处理编辑书签
const handleEditBookmark = (bookmark) => {
  selectedBookmark.value = bookmark
  bookmarkDialogVisible.value = true
}

// 处理删除书签
const handleDeleteBookmark = (bookmark) => {
  confirm.require({
    message: `确定要删除书签 "${bookmark.name}" 吗？`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bookmarksStore.deleteBookmark(bookmark.id)
        toast.add({
          severity: 'success',
          summary: '删除成功',
          detail: '书签已删除',
          life: 2000,
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: '删除失败',
          detail: error.message,
          life: 3000,
        })
      }
    },
  })
}

// 书签右键菜单
const handleBookmarkContextMenu = () => {
  // 右键菜单功能将在后续实现
}

// 处理添加分类
const handleAddCategory = (level, parentId = null) => {
  selectedCategory.value = null
  categoryLevel.value = level
  categoryParentId.value = parentId
  categoryDialogVisible.value = true
}

// 处理编辑分类
const handleEditCategory = (data) => {
  if (data.category) {
    selectedCategory.value = data.category
    categoryLevel.value = data.level || 1
  } else {
    // 从 CategoryTabs 传来的分类对象
    selectedCategory.value = data
    categoryLevel.value = 1
  }
  categoryDialogVisible.value = true
}

// 书签保存成功
const handleBookmarkSaved = () => {
  bookmarksStore.loadBookmarks()
}

// 分类保存成功
const handleCategorySaved = () => {
  bookmarksStore.loadBookmarks()
}

// 处理导入完成
const handleImported = (result) => {
  toast.add({
    severity: 'success',
    summary: '导入完成',
    detail: `成功导入 ${result.mergedCount} 个书签`,
    life: 3000,
  })
}

// 处理搜索结果
const handleSearchResults = (data) => {
  searchResults.value = data.results
  searchKeyword.value = data.query
}

// 处理搜索选择
const handleSearchSelect = (bookmark) => {
  openBookmark(bookmark)
}

// 处理搜索清除
const handleSearchClear = () => {
  searchResults.value = null
  searchKeyword.value = ''
}

// 组件挂载时加载数据
onMounted(async () => {
  try {
    await bookmarksStore.loadBookmarks()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '加载失败',
      detail: error.message || '无法加载书签数据',
      life: 3000,
    })
  }
})
</script>

<style scoped>
.bookmarks-view {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 1.5rem;
}

/* 页面头部 */
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title i {
  color: var(--primary-color);
}

.stats-bar {
  display: flex;
  gap: 1rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-badge i {
  color: var(--primary-color);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 400px;
  color: var(--text-secondary);
}

/* 书签内容 */
.bookmarks-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
}

/* 无侧边栏时的布局 */
.main-content.no-sidebar {
  grid-template-columns: 1fr;
}

/* 书签列表区域 */
.bookmarks-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0; /* 重要：允许 flex 子元素缩小 */
}

/* 书签网格容器 */
.bookmarks-grid-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 面包屑 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-item:hover {
  color: var(--primary-color);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: 600;
  cursor: default;
}

.breadcrumb i {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

/* 书签网格 */
.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 200px 1fr;
    gap: 1rem;
  }

  .bookmarks-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .bookmarks-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .stats-bar {
    width: 100%;
    flex-wrap: wrap;
  }

  .main-content {
    grid-template-columns: 1fr;
  }

  .bookmarks-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stat-badge {
    font-size: 0.8125rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
