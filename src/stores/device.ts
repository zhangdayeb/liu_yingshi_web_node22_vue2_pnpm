import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDeviceStore = defineStore('device', () => {
  const screenWidth = ref(window.innerWidth)
  
  const isMobile = computed(() => screenWidth.value < 768)
  const isTablet = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
  const isDesktop = computed(() => screenWidth.value >= 1024)
  
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })
  
  const initDeviceDetection = () => {
    const updateWidth = () => {
      screenWidth.value = window.innerWidth
    }
    
    window.addEventListener('resize', updateWidth)
  }
  
  return {
    screenWidth,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    initDeviceDetection
  }
})