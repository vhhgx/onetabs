<template>
  <div class="sessions-view">
    <div class="sessions-container">
      <!-- 顶部操作栏 -->
      <!-- <div class="sessions-header">
        <h2 class="header-title">会话收纳</h2>
        <div class="header-actions">
          <button class="btn btn-primary" @click="addMockData" :disabled="isLoading">
            <i class="pi pi-plus"></i>
            <span>添加测试数据</span>
          </button>
        </div>
      </div> -->

      <!-- 空状态 -->
      <EmptyState
        v-if="!isLoading && sessions.length === 0"
        icon="pi pi-clock"
        title="还没有保存的会话"
        description="点击浏览器工具栏的扩展图标即可保存当前窗口的所有标签页"
      >
        <template #icon>
          <div style="font-size: 64px">📦</div>
        </template>
        <template #action>
          <button class="btn btn-primary" @click="addMockData">
            <i class="pi pi-plus"></i>
            <span>添加测试数据</span>
          </button>
        </template>
      </EmptyState>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 会话列表 -->
      <div v-else-if="sessions.length > 0" class="sessions-list">
        <SessionCard
          v-for="session in sessions"
          :key="session.date"
          :session="session"
          @restore="handleRestore"
          @restore-group="handleRestoreGroup"
          @delete="handleDelete"
          @toggle-pin="handleTogglePin"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSessionsStore } from '@/stores/sessionsStore'
import SessionCard from '@/components/SessionCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useToast } from 'primevue/usetoast'

const sessionsStore = useSessionsStore()
const toast = useToast()

// 状态
const isLoading = computed(() => sessionsStore.isLoading)
const sessions = computed(() => sessionsStore.getSessions)

// Mock数据生成函数
const generateMockSession = (type = 'ungrouped') => {
  const now = Date.now()
  const randomOffset = Math.floor(Math.random() * 1000000) // 随机时间偏移

  if (type === 'grouped') {
    // 生成分组会话
    const groupColors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey']
    const groupNames = ['工作', '学习', '娱乐', '购物', '开发', '设计', '阅读']
    const randomColor = groupColors[Math.floor(Math.random() * groupColors.length)]
    const randomName = groupNames[Math.floor(Math.random() * groupNames.length)]

    return {
      date: now - randomOffset,
      type: 'grouped',
      title: randomName,
      isPinned: false,
      groupInfo: {
        id: Math.floor(Math.random() * 10000),
        title: randomName,
        color: randomColor,
        collapsed: false,
      },
      tabs: [
        {
          url: 'https://github.com',
          title: 'GitHub - Where the world builds software',
          favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
          groupId: 1,
        },
        {
          url: 'https://stackoverflow.com',
          title: 'Stack Overflow - Where Developers Learn',
          favIconUrl: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
          groupId: 1,
        },
        {
          url: 'https://developer.mozilla.org',
          title: 'MDN Web Docs',
          favIconUrl: 'https://developer.mozilla.org/favicon-48x48.png',
          groupId: 1,
        },
        {
          url: 'https://vuejs.org',
          title: 'Vue.js - The Progressive JavaScript Framework',
          favIconUrl: 'https://vuejs.org/logo.svg',
          groupId: 1,
        },
      ],
    }
  } else {
    // 生成未分组会话
    return {
      date: now - randomOffset,
      type: 'ungrouped',
      title: '未分组标签',
      isPinned: false,
      tabs: [
        {
          url: 'https://www.google.com',
          title: 'Google',
          favIconUrl: 'https://www.google.com/favicon.ico',
          groupId: -1,
        },
        {
          url: 'https://www.youtube.com',
          title: 'YouTube',
          favIconUrl: 'https://www.youtube.com/favicon.ico',
          groupId: -1,
        },
        {
          url: 'https://twitter.com',
          title: 'Twitter',
          favIconUrl: 'https://abs.twimg.com/favicons/twitter.ico',
          groupId: -1,
        },
        {
          url: 'https://www.reddit.com',
          title: 'Reddit - Dive into anything',
          favIconUrl: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png',
          groupId: -1,
        },
        {
          url: 'https://news.ycombinator.com',
          title: 'Hacker News',
          favIconUrl: 'https://news.ycombinator.com/favicon.ico',
          groupId: -1,
        },
      ],
    }
  }
}

// 添加Mock数据
const addMockData = async () => {
  try {
    console.log('开始添加Mock数据')
    // 随机生成1-2个会话
    const sessionCount = Math.floor(Math.random() * 2) + 1
    console.log(`准备生成 ${sessionCount} 个会话`)

    for (let i = 0; i < sessionCount; i++) {
      // 随机决定是分组还是未分组（60%概率为分组）
      const type = Math.random() > 0.4 ? 'grouped' : 'ungrouped'
      const mockSession = generateMockSession(type)
      console.log(`生成第 ${i + 1} 个会话 (${type}):`, mockSession)

      // 保存到store
      await sessionsStore.saveSession(mockSession)
      console.log(`第 ${i + 1} 个会话保存完成`)
    }

    // 重新加载会话列表
    console.log('重新加载会话列表')
    await sessionsStore.loadSessions()
    console.log('会话列表已刷新，当前数量:', sessions.value.length)

    toast.add({
      severity: 'success',
      summary: '添加成功',
      detail: `已添加 ${sessionCount} 个测试会话`,
      life: 3000,
    })
  } catch (error) {
    console.error('添加Mock数据失败:', error)
    toast.add({
      severity: 'error',
      summary: '添加失败',
      detail: error.message || '添加测试数据时出错',
      life: 3000,
    })
  }
}

// 页面挂载时加载数据
onMounted(async () => {
  console.log('SessionsView 挂载，开始加载数据')
  await sessionsStore.loadSessions()
  console.log('数据加载完成，会话数量:', sessions.value.length)
})

// 恢复整个会话
const handleRestore = async (sessionId) => {
  try {
    await sessionsStore.restoreSession(sessionId)
    toast.add({
      severity: 'success',
      summary: '恢复成功',
      detail: '已在新窗口中打开所有标签页',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '恢复失败',
      detail: error.message || '恢复会话时出错',
      life: 3000,
    })
  }
}

// 恢复标签页组
const handleRestoreGroup = async (sessionId) => {
  try {
    await sessionsStore.restoreGroup(sessionId)
    toast.add({
      severity: 'success',
      summary: '恢复成功',
      detail: '已恢复标签页组',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '恢复失败',
      detail: error.message || '恢复标签页组时出错',
      life: 3000,
    })
  }
}

// 删除会话
const handleDelete = async (sessionId) => {
  if (!confirm('确定要删除这个会话吗？')) {
    return
  }

  try {
    await sessionsStore.deleteSession(sessionId)
    toast.add({
      severity: 'success',
      summary: '删除成功',
      detail: '会话已删除',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '删除失败',
      detail: error.message || '删除会话时出错',
      life: 3000,
    })
  }
}

// 切换置顶
const handleTogglePin = async (sessionId) => {
  try {
    await sessionsStore.togglePinSession(sessionId)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '操作失败',
      detail: error.message || '切换置顶状态时出错',
      life: 3000,
    })
  }
}
</script>

<style scoped>
.sessions-view {
  height: 100%;
  overflow: hidden;
  /* background: #f9fafb; */
}

.sessions-container {
  height: 100%;
  /* padding: 16px; */
  overflow-y: auto;
}

/* 顶部操作栏 */
.sessions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #6b7280;
}

.empty-hint {
  font-size: 14px;
  margin: 4px 0;
  color: #9ca3af;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
  color: #9ca3af;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 会话列表 */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 8px;
  /* padding-bottom: 24px; */
}
</style>
