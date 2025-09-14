<template>
  <div class="ad-banner" v-if="adList.length > 0">
    <!-- 移动端轮播 -->
    <van-swipe v-if="deviceStore.isMobile" :autoplay="5000" indicator-color="#fff">
      <van-swipe-item v-for="ad in adList" :key="ad.id">
        <a :href="ad.jump_url || '#'" target="_blank">
          <img :src="ad.img_url" :alt="ad.title" />
        </a>
      </van-swipe-item>
    </van-swipe>
    
    <!-- PC端轮播 -->
    <el-carousel v-if="!deviceStore.isMobile" height="160px" :interval="5000" arrow="always">
      <el-carousel-item v-for="ad in adList" :key="ad.id">
        <a :href="ad.jump_url || '#'" target="_blank">
          <img :src="ad.img_url" :alt="ad.title" />
        </a>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { adApi } from '@/api/ad'

const deviceStore = useDeviceStore()
const adList = ref([])

// 加载广告
const loadAds = async () => {
  try {
    // 移动端 type_id = 1, PC端 type_id = 2
    const typeId = deviceStore.isMobile ? 1 : 2
    const res = await adApi.getAdList(typeId)
    
    if (res.code === 200 && res.data) {
      adList.value = res.data
    }
  } catch (error) {
    console.error('加载广告失败:', error)
    adList.value = []
  }
}

// 组件挂载时自动加载
onMounted(() => {
  loadAds()
})
</script>

<style lang="scss" scoped>
.ad-banner {
  width: 100%;
  margin-bottom: 10px;
  
  // 移动端轮播
  :deep(.van-swipe) {
    width: 100%;
    height: 100px;
    
    .van-swipe-item {
      a {
        display: block;
        width: 100%;
        height: 100%;
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
  
  // PC端轮播
  :deep(.el-carousel) {
    width: 100%;
    
    .el-carousel__item {
      a {
        display: block;
        width: 100%;
        height: 100%;
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    // 箭头样式
    .el-carousel__arrow {
      background-color: rgba(31, 45, 61, 0.5);
      color: #fff;
      
      &:hover {
        background-color: rgba(31, 45, 61, 0.8);
      }
    }
  }
}
</style>