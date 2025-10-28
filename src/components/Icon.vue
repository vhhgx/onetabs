<template>
  <div class="vh-icon">
    <i :class="['iconsax', `vuesax-linear-${icon}`]"></i>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
})
</script>

<style scoped lang="scss">
.vh-icon {
  .iconsax {
    left: 0;
  }
}
</style>
