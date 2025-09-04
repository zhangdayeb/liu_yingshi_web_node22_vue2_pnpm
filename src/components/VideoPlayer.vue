<template>
  <div ref="playerRef" class="video-player"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Artplayer from 'artplayer'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const playerRef = ref(null)
let artInstance = null

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  if (artInstance) {
    artInstance.destroy()
  }
})

watch(() => props.url, (newUrl) => {
  if (artInstance && newUrl) {
    artInstance.switchUrl(newUrl)
  }
})

const initPlayer = () => {
  artInstance = new Artplayer({
    container: playerRef.value,
    url: props.url,
    title: props.title,
    autoplay: false,
    volume: 0.5,
    muted: false,
    autoSize: true,
    autoMini: true,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    theme: '#409eff',
    lang: 'zh-cn',
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    }
  })
}
</script>

<style lang="scss" scoped>
.video-player {
  width: 100%;
  height: 100%;
  background: #000;
}
</style>