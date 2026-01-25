<template>
  <div id="container-block" style="display: flex; height: 100%; width: 100%; padding: 12px">
    <div
      :style="{
        width: isExpanded ? '320px' : '0',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
      }"
    >
      <div style="width: 320px; height: 100%">
        <SessionsView></SessionsView>
      </div>
    </div>
    <div
      :style="{
        // borderRadius: '20px 0 0 20px',
        borderRadius: '20px',
        backgroundColor: 'var(--bg-active)',
        height: '100%',
        width: isExpanded ? 'calc(100% - 320px)' : '100%',
        transition: 'width 0.3s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }"
      style="padding: 20px"
      id="container"
    >
      <!-- 拖拽手柄 -->
      <div
        :style="{
          position: 'absolute',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
        }"
        @mousedown="handleMouseDown"
      >
        <div
          :style="{
            width: '5px',
            height: '40px',
            backgroundColor: 'var(--text-secondary)',
            borderRadius: '8px',
            opacity: 0.4,
          }"
        ></div>
      </div>

      <div style="height: 100%; width: 100%; display: flex; flex-direction: column" id="bookmark">
        <div style="flex: 1; overflow: auto">
          <CollectionsView v-if="activeTab === 'collections'" />
          <TemplatesView v-else-if="activeTab === 'templates'" />
          <BookmarksView v-else />
        </div>
        <div
          style="
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
          "
        >
          <button
            style="border: none; background: none; cursor: pointer; font-weight: 600"
            :style="{ color: activeTab === 'collections' ? 'var(--text-primary)' : 'var(--text-secondary)' }"
            @click="activeTab = 'collections'"
          >
            Collections
          </button>
          <button
            style="border: none; background: none; cursor: pointer; font-weight: 600"
            :style="{ color: activeTab === 'templates' ? 'var(--text-primary)' : 'var(--text-secondary)' }"
            @click="activeTab = 'templates'"
          >
            Templates
          </button>
          <button
            style="border: none; background: none; cursor: pointer; font-weight: 600"
            :style="{ color: activeTab === 'bookmarks' ? 'var(--text-primary)' : 'var(--text-secondary)' }"
            @click="activeTab = 'bookmarks'"
          >
            Bookmarks
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SessionsView from './SessionsView.vue'
import CollectionsView from './CollectionsView.vue'
import TemplatesView from './TemplatesView.vue'
import BookmarksView from './BookmarksView.vue'

const isExpanded = ref(false)
const isDragging = ref(false)
const startX = ref(0)
const dragDistance = ref(0)
const activeTab = ref('bookmarks')

const handleMouseDown = (e) => {
  isDragging.value = true
  startX.value = e.clientX
  dragDistance.value = 0
  document.body.style.cursor = 'grabbing'
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return

  dragDistance.value = e.clientX - startX.value

  // 根据拖拽方向和距离判断
  if (Math.abs(dragDistance.value) > 50) {
    if (dragDistance.value > 0 && !isExpanded.value) {
      // 向右拖拽且未展开，则展开
      isExpanded.value = true
      cleanup()
    } else if (dragDistance.value < 0 && isExpanded.value) {
      // 向左拖拽且已展开，则收起
      isExpanded.value = false
      cleanup()
    }
  }
}

const handleMouseUp = () => {
  // 如果拖拽距离小于50px，视为点击
  if (Math.abs(dragDistance.value) < 50) {
    isExpanded.value = !isExpanded.value
  }
  cleanup()
}

const cleanup = () => {
  isDragging.value = false
  document.body.style.cursor = ''
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}
</script>

<style lang="scss" scoped>
.default {
}
</style>
