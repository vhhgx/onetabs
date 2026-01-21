<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="{
        left: position.x + 'px',
        top: position.y + 'px'
      }"
      @click.stop
    >
      <div class="context-menu-items">
        <template v-for="item in items" :key="item.id">
          <div
            v-if="!item.divider"
            class="context-menu-item"
            :class="{ disabled: item.disabled, danger: item.danger }"
            @click="handleItemClick(item)"
          >
            <i v-if="item.icon" :class="item.icon" class="menu-icon"></i>
            <span>{{ item.label }}</span>
            <i v-if="item.submenu" class="pi pi-angle-right ml-auto"></i>
          </div>
          <div v-else class="context-menu-divider"></div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'select', 'close'])

const menuRef = ref(null)

const handleItemClick = (item) => {
  if (item.disabled) return

  emit('select', item)
  emit('update:visible', false)
  emit('close')
}

const handleClickOutside = (e) => {
  // 如果菜单不可见，不处理
  if (!props.visible) return
  
  // 如果点击的是菜单内部，不关闭
  if (menuRef.value && menuRef.value.contains(e.target)) {
    return
  }
  
  // 其他情况都关闭菜单
  emit('update:visible', false)
  emit('close')
}

const adjustPosition = async () => {
  await nextTick()
  if (!menuRef.value) return

  const menu = menuRef.value
  const rect = menu.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let { x, y } = props.position

  // 调整水平位置
  if (x + rect.width > viewportWidth) {
    x = viewportWidth - rect.width - 10
  }

  // 调整垂直位置
  if (y + rect.height > viewportHeight) {
    y = viewportHeight - rect.height - 10
  }

  menu.style.left = x + 'px'
  menu.style.top = y + 'px'
}

// 在组件挂载时就添加全局监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  document.addEventListener('contextmenu', handleClickOutside, true)
})

// 监听 visible 变化，调整位置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    adjustPosition()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  document.removeEventListener('contextmenu', handleClickOutside, true)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 4px 0;
  user-select: none;
}

.context-menu-items {
  display: flex;
  flex-direction: column;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 14px;
  color: #374151;
}

.context-menu-item:hover:not(.disabled) {
  background-color: #f3f4f6;
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover:not(.disabled) {
  background-color: #fee2e2;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}

.context-menu-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
}
</style>
