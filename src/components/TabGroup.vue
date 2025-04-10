<template>
  <!-- ...existing code... -->
</template>

<script>
import { useTabsStore } from '../stores/tabsStore'
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'TabGroup',
  props: {
    groupId: {
      type: Number,
      required: true
    }
  },
  
  setup(props) {
    const tabsStore = useTabsStore()
    
    // 使用 computed 查找当前组
    const group = computed(() => {
      return tabsStore.tabGroups.find(g => g.id === props.groupId)
    })
    
    // 查找组内的标签
    const groupTabs = computed(() => {
      if (!group.value) return []
      const tabIds = group.value.tabs || []
      return tabsStore.tabs.filter(tab => tabIds.includes(tab.id))
    })
    
    return {
      group,
      groupTabs,
      // 直接返回 store 中的 actions
      removeTab: tabsStore.removeTab
    }
  }
})
</script>

<style>
  /* ...existing code... */
</style>