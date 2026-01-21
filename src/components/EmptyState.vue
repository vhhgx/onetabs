<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </div>
    
    <h3 class="empty-title">{{ title }}</h3>
    
    <p v-if="description" class="empty-description">
      {{ description }}
    </p>
    
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'pi pi-inbox'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  margin-bottom: 24px;
  font-size: 64px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-icon i {
  font-size: 64px;
  color: #9ca3af;
}

.empty-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.empty-description {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #6b7280;
  max-width: 400px;
  line-height: 1.6;
}

.empty-action {
  margin-top: 8px;
}
</style>
