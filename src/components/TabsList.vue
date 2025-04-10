<template>
  <div class="tabs-list">
    <div v-if="loading">加载中...</div>
    <div v-else-if="tabs.length === 0">
      没有保存的标签
    </div>
    <div v-else>
      <div v-for="tab in tabs" :key="tab.id" class="tab-item">
        <img :src="tab.favIconUrl" alt="favicon" class="favicon" />
        <a :href="tab.url" target="_blank">{{ tab.title }}</a>
      </div>
    </div>
    
    <button @click="captureTabs">捕获当前标签</button>
    <button @click="createGroup">创建标签组</button>
    <button @click="syncTabsWithFetch">使用Fetch同步标签</button>
    <button @click="syncTabsWithAxios">使用Axios同步标签</button>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useTabsStore } from '../stores/tabsStore'
import axios from 'axios' // 需要安装: npm install axios

export default defineComponent({
  name: 'TabsList',
  
  setup() {
    const tabsStore = useTabsStore()
    const loading = ref(true)
    const apiBaseUrl = 'https://your-api-endpoint.com/api'
    
    onMounted(async () => {
      await tabsStore.loadTabs()
      loading.value = false
    })
    
    const captureTabs = async () => {
      loading.value = true
      await tabsStore.getCurrentTabs()
      loading.value = false
    }
    
    const createGroup = async () => {
      const name = prompt('请输入标签组名称:', '新标签组')
      if (name) {
        await tabsStore.createTabGroup(name)
      }
    }
    
    // 使用 fetch API 与服务器交互
    const syncTabsWithFetch = async () => {
      try {
        loading.value = true
        
        // 获取当前标签
        const tabs = tabsStore.getTabs
        
        // 发送到服务器
        const response = await fetch(`${apiBaseUrl}/tabs/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_AUTH_TOKEN' // 如果需要认证
          },
          body: JSON.stringify({ tabs })
        })
        
        if (!response.ok) {
          throw new Error('网络请求失败')
        }
        
        const result = await response.json()
        console.log('同步成功:', result)
        alert('标签已成功同步到服务器')
      } catch (error) {
        console.error('同步失败:', error)
        alert('同步失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 使用 axios 与服务器交互
    const syncTabsWithAxios = async () => {
      try {
        loading.value = true
        
        // 获取当前标签
        const tabs = tabsStore.getTabs
        
        // 发送到服务器
        const result = await axios({
          method: 'post',
          url: `${apiBaseUrl}/tabs/sync`,
          headers: {
            'Authorization': 'Bearer YOUR_AUTH_TOKEN' // 如果需要认证
          },
          data: { tabs }
        })
        
        console.log('同步成功:', result.data)
        alert('标签已成功同步到服务器')
      } catch (error) {
        console.error('同步失败:', error.response || error)
        alert('同步失败: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }
    
    return {
      tabs: tabsStore.getTabs,
      loading,
      captureTabs,
      createGroup,
      syncTabsWithFetch,
      syncTabsWithAxios
    }
  }
})
</script>

<style scoped>
.tabs-list {
  padding: 16px;
}
.tab-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.favicon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
</style>
