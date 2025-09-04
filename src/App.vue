<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDeviceStore } from '@/store/device'

const deviceStore = useDeviceStore()

onMounted(() => {
  // 初始化设备类型检测
  deviceStore.initDeviceDetection()
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>