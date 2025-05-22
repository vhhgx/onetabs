<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
})
</script>

<style lang="scss" scoped>
.app-container {
  width: 100vw;
  height: 100dvh;
}
</style>
