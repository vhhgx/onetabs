<template>
  <div v-if="pinnedBookmarks.length > 0" class="pinned-bookmarks-bar">
    <div class="pinned-header">
      <h2 class="pinned-title">
        <i class="pi pi-thumbtack"></i>
        固定的书签
        <span class="pinned-count">({{ pinnedBookmarks.length }})</span>
      </h2>
      <button v-if="pinnedBookmarks.length > maxDisplay" class="view-all-btn" @click="toggleExpanded">
        <span>{{ isExpanded ? '收起' : '查看全部' }}</span>
        <i :class="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
      </button>
    </div>

    <div :class="['pinned-content', { expanded: isExpanded }]">
      <div class="pinned-list">
        <div
          v-for="bookmark in displayedBookmarks"
          :key="bookmark.id"
          class="pinned-item"
          @click="openBookmark(bookmark)"
          @contextmenu.prevent="(e) => handleContextMenu(e, bookmark)"
        >
          <img
            :src="bookmark.favIconUrl || defaultIcon"
            :alt="bookmark.name"
            class="pinned-icon"
            @error="handleIconError"
          />
          <span class="pinned-name" :title="bookmark.name">{{ bookmark.name }}</span>
          <button class="unpin-btn" @click.stop="unpinBookmark(bookmark)" title="取消固定">
            <i class="pi pi-times"></i>
          </button>
        </div>
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

const props = defineProps({
  maxDisplay: {
    type: Number,
    default: 8,
  },
})

const isExpanded = ref(false)
const defaultIcon = 'https://www.google.com/favicon.ico'

// 固定的书签列表
const pinnedBookmarks = computed(() => bookmarksStore.getPinnedBookmarks)

// 显示的书签（根据展开状态）
const displayedBookmarks = computed(() => {
  if (isExpanded.value) {
    return pinnedBookmarks.value
  }
  return pinnedBookmarks.value.slice(0, props.maxDisplay)
})

// 切换展开状态
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
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

// 取消固定书签
const unpinBookmark = (bookmark) => {
  confirm.require({
    message: `确定要取消固定 "${bookmark.name}" 吗？`,
    header: '取消固定',
    icon: 'pi pi-question-circle',
    accept: async () => {
      try {
        await bookmarksStore.unpinBookmark(bookmark.id)
        toast.add({
          severity: 'success',
          summary: '取消成功',
          detail: '已取消固定书签',
          life: 2000,
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: '操作失败',
          detail: error.message || '取消固定失败',
          life: 3000,
        })
      }
    },
  })
}

// 处理右键菜单
const handleContextMenu = (event, bookmark) => {
  const menuItems = [
    {
      label: '在新标签页打开',
      icon: 'pi pi-external-link',
      command: () => openBookmark(bookmark),
    },
    {
      label: '取消固定',
      icon: 'pi pi-thumbtack',
      command: () => unpinBookmark(bookmark),
    },
    {
      separator: true,
    },
    {
      label: '复制链接',
      icon: 'pi pi-copy',
      command: () => {
        navigator.clipboard.writeText(bookmark.url)
        toast.add({
          severity: 'success',
          summary: '已复制',
          detail: '链接已复制到剪贴板',
          life: 2000,
        })
      },
    },
  ]

  contextMenu.showMenu(event, menuItems)
}

// 图标加载失败
const handleIconError = (event) => {
  event.target.src = defaultIcon
}
</script>

<style scoped>
.pinned-bookmarks-bar {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.pinned-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.pinned-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.pinned-title i {
  color: var(--primary-color);
  font-size: 1rem;
}

.pinned-count {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-secondary);
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.pinned-content {
  max-height: 120px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.pinned-content.expanded {
  max-height: 1000px;
}

.pinned-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.pinned-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pinned-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.pinned-item:hover .unpin-btn {
  opacity: 1;
}

.pinned-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-secondary);
}

.pinned-name {
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.unpin-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.unpin-btn:hover {
  background: #ef4444;
  transform: scale(1.1);
}

/* 响应式 */
@media (max-width: 768px) {
  .pinned-bookmarks-bar {
    padding: 1rem;
  }

  .pinned-list {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  .pinned-item {
    padding: 0.75rem 0.5rem;
  }

  .pinned-icon {
    width: 32px;
    height: 32px;
  }

  .pinned-name {
    font-size: 0.8125rem;
  }

  .unpin-btn {
    opacity: 1;
  }
}
</style>
