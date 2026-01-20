<template>
  <div class="templates-view">
    <div class="placeholder">
      <div class="placeholder-icon">🚀</div>
      <h2>窗口模板管理</h2>
      <p>此功能将在 P1 阶段开发</p>
      <p class="hint">敬请期待...</p>
    </div>
  </div>
</template>

<script setup>
// P1 功能占位
</script>

<style scoped>
.templates-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.placeholder {
  text-align: center;
  color: #9ca3af;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #6b7280;
}

.placeholder p {
  font-size: 16px;
  margin: 4px 0;
}

.placeholder .hint {
  font-size: 14px;
  color: #d1d5db;
}
</style>
