<template>
  <div class="app-container">
    <!-- 顶部导航 -->
    <nav class="app-navbar">
      <div class="nav-brand">
        <i class="pi pi-bookmark"></i>
        <span>OneTabs</span>
      </div>
      
      <!-- 搜索框 -->
      <SearchBar ref="searchBarRef" @result-click="handleSearchResult" />
      
      <!-- 右侧操作 -->
      <div class="nav-actions">
        <button class="nav-btn" @click="showShortcutsHelp = true" title="快捷键帮助">
          <i class="pi pi-question-circle"></i>
        </button>
        <button class="nav-btn" @click="goToSettings" title="设置">
          <i class="pi pi-cog"></i>
        </button>
      </div>
    </nav>

    <!-- 路由视图 -->
    <router-view />

    <!-- Toast 通知组件 -->
    <Toast />
    
    <!-- 确认对话框组件 -->
    <ConfirmDialog />
    
    <!-- 快捷键帮助对话框 -->
    <ShortcutsHelp v-model:visible="showShortcutsHelp" />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import SearchBar from './components/SearchBar.vue'
import ShortcutsHelp from './components/ShortcutsHelp.vue'
import { useShortcuts } from './utils/shortcuts'
import { useThemeStore } from './stores/themeStore'

export default defineComponent({
  name: 'App',
  components: {
    Toast,
    ConfirmDialog,
    SearchBar,
    ShortcutsHelp
  },
  setup() {
    const router = useRouter()
    const themeStore = useThemeStore()
    const searchBarRef = ref(null)
    const showShortcutsHelp = ref(false)

    // 初始化主题
    onMounted(async () => {
      await themeStore.loadTheme()
    })

    // 注册全局快捷键
    useShortcuts({
      FOCUS_SEARCH: () => {
        const input = document.querySelector('.search-input')
        if (input) input.focus()
      },
      OPEN_SETTINGS: () => {
        router.push('/settings')
      },
      TAB_SESSIONS: () => {
        router.push('/?tab=sessions')
      },
      TAB_COLLECTIONS: () => {
        router.push('/?tab=collections')
      },
      TAB_TEMPLATES: () => {
        router.push('/?tab=templates')
      }
    })

    const handleSearchResult = ({ type, item }) => {
      console.log('Search result clicked:', type, item)
    }

    const goToSettings = () => {
      router.push('/settings')
    }

    return {
      searchBarRef,
      showShortcutsHelp,
      handleSearchResult,
      goToSettings
    }
  }
})
</script>

<style lang="scss" scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.app-navbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    flex-shrink: 0;

    i {
      color: var(--primary-color);
    }
  }

  .nav-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 18px;
    }

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  }
}

//body {
//  font-family: Arial, sans-serif;
//  margin: 0;
//  padding: 0;
//  background-color: #f5f5f5;
//}

//.onetabs-app {
//  max-width: 1200px;
//  margin: 0 auto;
//  padding: 20px;
//}

//header {
//  display: flex;
//  justify-content: space-between;
//  align-items: center;
//  margin-bottom: 20px;
//  padding-bottom: 10px;
//  border-bottom: 1px solid #e0e0e0;
//}
//
//h1 {
//  margin: 0;
//  color: #333;
//}
//
//.actions {
//  display: flex;
//  gap: 10px;
//}
//
//button {
//  cursor: pointer;
//  padding: 8px 16px;
//  border-radius: 4px;
//  border: none;
//  background-color: #4285f4;
//  color: white;
//  font-weight: 500;
//}
//
//button:hover {
//  background-color: #3367d6;
//}
//
//.delete-btn {
//  background-color: #ea4335;
//}
//
//.delete-btn:hover {
//  background-color: #d33426;
//}
//
//.tab-groups {
//  display: flex;
//  flex-direction: column;
//  gap: 20px;
//}
//
//.tab-group {
//  background-color: white;
//  border-radius: 8px;
//  padding: 15px;
//  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
//}
//
//.group-header {
//  display: flex;
//  justify-content: space-between;
//  align-items: center;
//  margin-bottom: 10px;
//}
//
//.group-header h2 {
//  margin: 0;
//  font-size: 18px;
//  color: #333;
//}
//
//.tab-list {
//  list-style: none;
//  margin: 0;
//  padding: 0;
//}
//
//.tab-item {
//  display: flex;
//  align-items: center;
//  padding: 8px 0;
//  border-bottom: 1px solid #f0f0f0;
//}
//
//.tab-item:last-child {
//  border-bottom: none;
//}
//
//.tab-icon {
//  width: 16px;
//  height: 16px;
//  margin-right: 10px;
//}
//
//.tab-item a {
//  flex: 1;
//  color: #1a73e8;
//  text-decoration: none;
//  white-space: nowrap;
//  overflow: hidden;
//  text-overflow: ellipsis;
//}
//
//.tab-item a:hover {
//  text-decoration: underline;
//}
//
//.delete-tab-btn {
//  background: none;
//  border: none;
//  color: #5f6368;
//  font-size: 16px;
//  padding: 4px 8px;
//  cursor: pointer;
//}
//
//.delete-tab-btn:hover {
//  color: #ea4335;
//  background-color: #f1f3f4;
//  border-radius: 50%;
//}
//
//.empty-state {
//  text-align: center;
//  padding: 40px 20px;
//  background-color: white;
//  border-radius: 8px;
//  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
//}
//
//.empty-state p {
//  color: #5f6368;
//  font-size: 16px;
//}
//
//.app-container {
//  width: 100%;
//  min-height: 100vh;
//  max-width: 1800px;
//  margin: 0 auto;
//  padding: 20px;
//}
//
//.app-navbar {
//  display: flex;
//  gap: 16px;
//  margin-bottom: 20px;
//  padding-bottom: 10px;
//  border-bottom: 1px solid #e0e0e0;
//}
//
//.app-navbar a {
//  color: #4285f4;
//  text-decoration: none;
//  font-weight: 500;
//  padding: 5px 10px;
//  border-bottom: 2px solid transparent;
//  transition: all 0.2s ease;
//}
//
//.app-navbar a:hover {
//  color: #3367d6;
//}
//
//.app-navbar a.active {
//  border-bottom: 2px solid #4285f4;
//  color: #3367d6;
//}
//
///* 路由过渡效果 */
//.fade-enter-active,
//.fade-leave-active {
//  transition: opacity 0.2s ease;
//}
//
//.fade-enter-from,
//.fade-leave-to {
//  opacity: 0;
//}
//
///* 基础按钮样式 */
//button {
//  cursor: pointer;
//  padding: 8px 16px;
//  border-radius: 4px;
//  border: none;
//  background-color: #4285f4;
//  color: white;
//  font-weight: 500;
//}
//
//button:hover {
//  background-color: #3367d6;
//}
//
//.delete-btn {
//  background-color: #ea4335;
//}
//
//.delete-btn:hover {
//  background-color: #d33426;
//}
//
///* 标签项样式 */
//.tab-item a {
//  flex: 1;
//  color: #1a73e8;
//  text-decoration: none;
//  white-space: nowrap;
//  overflow: hidden;
//  text-overflow: ellipsis;
//}
//
//.tab-item a:hover {
//  text-decoration: underline;
//}
//
//.delete-tab-btn {
//  background: none;
//  border: none;
//  color: #5f6368;
//  font-size: 16px;
//  padding: 4px 8px;
//  cursor: pointer;
//}
//
//.delete-tab-btn:hover {
//  color: #ea4335;
//  background-color: #f1f3f4;
//  border-radius: 50%;
//}
//
///* 空状态样式 */
//.empty-state {
//  text-align: center;
//  padding: 40px 20px;
//  background-color: white;
//  border-radius: 8px;
//  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
//}
//
//.empty-state p {
//  color: #5f6368;
//  font-size: 16px;
//}
</style>
