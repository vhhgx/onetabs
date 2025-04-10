<template>
  <!-- ...existing code... -->
</template>

<script>
import { useTabsStore } from '../stores/tabsStore'
import { defineComponent, computed, onMounted } from 'vue'

export default defineComponent({
  name: 'TabList',
  
  setup() {
    const tabsStore = useTabsStore()
    
    // 在组件加载时获取数据
    onMounted(async () => {
      await tabsStore.loadTabs()
    })
    
    // 使用 computed 替代 mapState 和 mapGetters
    const tabs = computed(() => tabsStore.getTabs)
    const tabGroups = computed(() => tabsStore.getTabGroups)
    const sortedTabs = computed(() => tabsStore.sortedTabs)
    const hasTabs = computed(() => tabsStore.hasTabs)
    
    // 返回需要在模板中使用的属性和方法
    return {
      tabs,
      tabGroups,
      sortedTabs,
      hasTabs,
      // 直接使用 store 中的 actions，替代 mapActions
      getCurrentTabs: tabsStore.getCurrentTabs,
      createTabGroup: tabsStore.createTabGroup,
      removeTab: tabsStore.removeTab,
      clearAllTabs: tabsStore.clearAllTabs
    }
  }
})
</script>

<style>
  /* ...existing code... */
</style>