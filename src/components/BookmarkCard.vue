<template>
  <div
    :class="['bookmark-card', { 'is-pinned': bookmark.pinned, 'is-favorite': bookmark.favorite }]"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 网站图标 -->
    <div class="bookmark-icon-wrapper">
      <img
        :src="bookmark.favIconUrl || defaultIcon"
        :alt="bookmark.name"
        class="bookmark-icon"
        @error="handleIconError"
      />
      <!-- 固定和收藏标记 -->
      <div v-if="bookmark.pinned || bookmark.favorite" class="badge-container">
        <span v-if="bookmark.pinned" class="badge badge-pin" title="已固定">📌</span>
        <span v-if="bookmark.favorite" class="badge badge-favorite" title="已收藏">⭐</span>
      </div>
    </div>

    <!-- 书签信息 -->
    <div class="bookmark-content">
      <h3 class="bookmark-name" :title="bookmark.name">{{ bookmark.name }}</h3>
      <p v-if="showDescription && bookmark.description" class="bookmark-description">
        {{ bookmark.description }}
      </p>
      <div class="bookmark-meta">
        <span class="bookmark-url" :title="bookmark.url">{{ displayUrl }}</span>
        <div v-if="bookmark.tags && bookmark.tags.length > 0" class="bookmark-tags">
          <span v-for="tag in bookmark.tags.slice(0, 3)" :key="tag" class="tag">
            {{ tag }}
          </span>
          <span v-if="bookmark.tags.length > 3" class="tag tag-more">
            +{{ bookmark.tags.length - 3 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="bookmark-actions" @click.stop>
      <button
        class="action-btn"
        :class="{ active: bookmark.pinned }"
        @click="togglePin"
        :title="bookmark.pinned ? '取消固定' : '固定'"
      >
        <i class="pi pi-thumbtack"></i>
      </button>
      <button
        class="action-btn"
        :class="{ active: bookmark.favorite }"
        @click="toggleFavorite"
        :title="bookmark.favorite ? '取消收藏' : '收藏'"
      >
        <i :class="bookmark.favorite ? 'pi pi-star-fill' : 'pi pi-star'"></i>
      </button>
      <button class="action-btn" @click="handleEdit" title="编辑">
        <i class="pi pi-pencil"></i>
      </button>
      <button class="action-btn action-delete" @click="handleDelete" title="删除">
        <i class="pi pi-trash"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { extractDomain } from '../utils/urlValidator'

const props = defineProps({
  bookmark: {
    type: Object,
    required: true,
  },
  showDescription: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['click', 'pin', 'favorite', 'edit', 'delete', 'contextmenu'])

const defaultIcon = 'https://www.google.com/favicon.ico'

// 显示的URL（只显示域名）
const displayUrl = computed(() => {
  const domain = extractDomain(props.bookmark.url)
  return domain || props.bookmark.url
})

// 处理点击
const handleClick = () => {
  emit('click', props.bookmark)
}

// 处理右键菜单
const handleContextMenu = (event) => {
  emit('contextmenu', { event, bookmark: props.bookmark })
}

// 切换固定状态
const togglePin = () => {
  emit('pin', props.bookmark)
}

// 切换收藏状态
const toggleFavorite = () => {
  emit('favorite', props.bookmark)
}

// 编辑书签
const handleEdit = () => {
  emit('edit', props.bookmark)
}

// 删除书签
const handleDelete = () => {
  emit('delete', props.bookmark)
}

// 图标加载失败
const handleIconError = (event) => {
  event.target.src = defaultIcon
}
</script>

<style scoped>
.bookmark-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.bookmark-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bookmark-card:active {
  transform: translateY(0);
}

.bookmark-card.is-pinned {
  border-left: 3px solid var(--primary-color);
}

.bookmark-card.is-favorite {
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(251, 191, 36, 0.05) 100%);
}

/* 图标区域 */
.bookmark-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmark-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-secondary);
}

.badge-container {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  gap: 2px;
}

.badge {
  font-size: 0.75rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 内容区域 */
.bookmark-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}

.bookmark-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.bookmark-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.bookmark-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bookmark-url {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-primary);
}

.tag-more {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 操作按钮 */
.bookmark-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.bookmark-card:hover .bookmark-actions {
  opacity: 1;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transform: scale(1.05);
}

.action-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-delete:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

/* 响应式 */
@media (max-width: 768px) {
  .bookmark-card {
    padding: 0.875rem;
  }

  .bookmark-icon {
    width: 40px;
    height: 40px;
  }

  .bookmark-name {
    font-size: 0.9375rem;
  }

  .bookmark-actions {
    opacity: 1;
  }
}
</style>
