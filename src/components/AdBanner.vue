<template>
  <div v-if="ads.length > 0" class="ad-banner">
    <!-- 单张广告 -->
    <div v-if="ads.length === 1" class="single-ad">
      <img :src="ads[0].image" :alt="ads[0].title" @click="handleAdClick(ads[0])" />
    </div>
    
    <!-- 多张广告轮播 -->
    <div v-else class="ad-carousel">
      <van-swipe v-if="deviceStore.isMobile" :autoplay="5000" indicator-color="#fff">
        <van-swipe-item v-for="ad in ads" :key="ad.id">
          <img :src="ad.image" :alt="ad.title" @click="handleAdClick(ad)" />
        </van-swipe-item>
      </van-swipe>
      
      <el-carousel v-else height="120px" :interval="5000">
        <el-carousel-item v-for="ad in ads" :key="ad.id">
          <img :src="ad.image" :alt="ad.title" @click="handleAdClick(ad)" />
        </el-carousel-item>
      </el-carousel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDeviceStore } from '@/store/device'
import { adApi } from '@/api/ad'

const props = defineProps({
  position: {
    type: String,
    required: true
  }
})

const deviceStore = useDeviceStore()
const ads = ref([])

onMounted(async () => {
  try {
    // 模拟广告数据，实际应从API获取
    // const res = await adApi.getAds(props.position)
    // ads.value = res.data
    
    // 临时模拟数据
    ads.value = [
      {
        id: 1,
        title: '广告1',
        image: 'https://via.placeholder.com/1920x120',
        link: 'https://example.com'
      }
    ]
  } catch (error) {
    console.error('获取广告失败:', error)
  }
})

const handleAdClick = (ad) => {
  if (ad.link) {
    window.open(ad.link, '_blank')
  }
}
</script>

<style lang="scss" scoped>
.ad-banner {
  width: 100%;
  margin-bottom: 10px;
  
  .single-ad, .ad-carousel {
    img {
      width: 100%;
      height: auto;
      cursor: pointer;
      display: block;
    }
  }
  
  @media (max-width: 768px) {
    .ad-banner {
      margin-bottom: 5px;
    }
  }
}
</style>