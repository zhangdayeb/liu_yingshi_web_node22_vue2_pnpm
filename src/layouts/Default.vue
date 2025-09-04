<template>
  <div class="default-layout">
    <!-- 广告位 -->
    <AdBanner position="top" />
    
    <!-- 主内容 -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import AdBanner from '@/components/AdBanner.vue'
</script>

<style lang="scss" scoped>
.default-layout {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>