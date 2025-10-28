<template>
  <div class="coordinate-label">
    <Icon :icon />
    <span class="label-text">{{ text }}</span>
  </div>
</template>

<script setup>
import Icon from '@/components/Icon.vue'

defineProps({
  icon: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
})
</script>

<style scoped lang="scss">
.coordinate-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

//.label-text {
//  margin-left: 8px; /* 根据需要调整间距 */
//}
</style>
