<template>
  <Dialog
    v-model:visible="isVisible"
    header="快捷键帮助"
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
    @hide="handleClose"
  >
    <div class="shortcuts-help">
      <div class="help-intro">
        <i class="pi pi-info-circle"></i>
        <p>使用快捷键可以更快速地操作 OneTabs</p>
      </div>

      <div class="shortcuts-list">
        <div
          v-for="item in shortcuts"
          :key="item.action"
          class="shortcut-item"
        >
          <div class="shortcut-description">{{ item.description }}</div>
          <div class="shortcut-keys">
            <kbd
              v-for="(key, index) in item.shortcut.split('')"
              :key="index"
              class="key"
            >
              {{ key }}
            </kbd>
          </div>
        </div>
      </div>

      <div class="help-footer">
        <p class="help-tip">
          <i class="pi pi-lightbulb"></i>
          提示：在输入框中，按 <kbd>Esc</kbd> 可以失去焦点
        </p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-primary" @click="handleClose">知道了</button>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { getShortcutHelp } from '../utils/shortcuts'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const isVisible = ref(false)
const shortcuts = getShortcutHelp()

watch(() => props.visible, (newVal) => {
  isVisible.value = newVal
})

watch(isVisible, (newVal) => {
  emit('update:visible', newVal)
})

const handleClose = () => {
  isVisible.value = false
}
</script>

<style scoped>
.shortcuts-help {
  padding: 4px 0;
}

.help-intro {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #eff6ff;
  border-radius: 8px;
  margin-bottom: 20px;
}

.help-intro i {
  font-size: 20px;
  color: #3b82f6;
}

.help-intro p {
  margin: 0;
  color: #1e40af;
  font-size: 14px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;
}

.shortcut-item:hover {
  background: #f3f4f6;
}

.shortcut-description {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  background: white;
  border: 1px solid #d1d5db;
  border-bottom: 2px solid #9ca3af;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.help-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.help-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.help-tip i {
  color: #f59e0b;
}

.help-tip kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
