<template>
  <div class="app-container">
    <!-- 顶部导航 -->
    <nav class="app-navbar">
      <div class="nav-brand">
        <i class="pi pi-bookmark"></i>
        <span>OneTabs</span>
      </div>
      <!-- 可选：添加搜索框和设置按钮 -->
    </nav>

    <!-- 路由视图 -->
    <router-view />

    <!-- Toast 通知组件 -->
    <Toast />
    
    <!-- 确认对话框组件 -->
    <ConfirmDialog />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

export default defineComponent({
  name: 'App',
  components: {
    Toast,
    ConfirmDialog
  }
})
</script>

<style lang="scss" scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 700;
    color: #111827;

    i {
      color: #3b82f6;
    }
  }

  .nav-links {
    display: flex;
    gap: 8px;

    a {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;

      i {
        font-size: 16px;
      }

      &:hover {
        background: #f3f4f6;
        color: #374151;
      }

      &.active {
        background: #eff6ff;
        color: #3b82f6;
      }
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
