<template>
  <div class="detail-page" v-if="movieInfo">
    <!-- 移动端 -->
    <div v-if="deviceStore.isMobile" class="mobile-view">
      <div class="movie-poster">
        <img :src="movieInfo.video_img_url" :alt="movieInfo.video_title" />
      </div>
      
      <div class="movie-info">
        <h2>{{ movieInfo.video_title }}</h2>
        <van-tag type="primary">{{ movieInfo.type_name }}</van-tag>
        <p class="play-times">播放：{{ movieInfo.play_times_formatted }}</p>
        <p class="description">{{ movieInfo.video_describe }}</p>
      </div>
      
      <van-button 
        type="primary" 
        block 
        @click="goPlayer"
        class="play-button"
      >
        立即播放
      </van-button>
      
      <!-- 剧集列表 -->
      <div v-if="episodes.length > 0" class="episodes">
        <h3>剧集列表</h3>
        <div class="episode-grid">
          <van-button
            v-for="(ep, index) in episodes"
            :key="index"
            size="small"
            @click="playEpisode(index)"
          >
            {{ ep.name }}
          </van-button>
        </div>
      </div>
    </div>
    
    <!-- PC端 -->
    <div v-else class="desktop-view">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="movie-poster">
            <img :src="movieInfo.video_img_url" :alt="movieInfo.video_title" />
          </div>
        </el-col>
        
        <el-col :span="16">
          <div class="movie-info">
            <h1>{{ movieInfo.video_title }}</h1>
            <el-tag>{{ movieInfo.type_name }}</el-tag>
            <p class="play-times">播放量：{{ movieInfo.play_times_formatted }}</p>
            <p class="description">{{ movieInfo.video_describe }}</p>
            
            <el-button type="primary" size="large" @click="goPlayer">
              立即播放
            </el-button>
          </div>
          
          <!-- 剧集列表 -->
          <div v-if="episodes.length > 0" class="episodes">
            <h3>剧集列表</h3>
            <div class="episode-grid">
              <el-button
                v-for="(ep, index) in episodes"
                :key="index"
                @click="playEpisode(index)"
              >
                {{ ep.name }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { movieApi } from '@/api/movie'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()

const movieInfo = ref(null)
const episodes = ref([])

onMounted(async () => {
  const id = route.params.id
  await loadMovieInfo(id)
})

const loadMovieInfo = async (id) => {
  try {
    const res = await movieApi.getInfo(id)
    movieInfo.value = res.data
    
    // 解析剧集信息
    if (movieInfo.value.video_info) {
      try {
        episodes.value = JSON.parse(movieInfo.value.video_info)
      } catch {
        episodes.value = []
      }
    }
  } catch (error) {
    console.error('加载影片信息失败:', error)
  }
}

const goPlayer = () => {
  router.push(`/player/${route.params.id}`)
}

const playEpisode = (index: number) => {
  router.push(`/player/${route.params.id}?episode=${index}`)
}
</script>

<style lang="scss" scoped>
.detail-page {
  padding: 20px;
  
  .mobile-view {
    .movie-poster {
      width: 100%;
      margin-bottom: 20px;
      
      img {
        width: 100%;
        border-radius: 8px;
      }
    }
    
    .movie-info {
      margin-bottom: 20px;
      
      h2 {
        margin-bottom: 10px;
      }
      
      .play-times {
        color: #666;
        margin: 10px 0;
      }
      
      .description {
        color: #333;
        line-height: 1.6;
      }
    }
    
    .play-button {
      margin-bottom: 20px;
    }
    
    .episodes {
      h3 {
        margin-bottom: 10px;
      }
      
      .episode-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
    }
  }
  
  .desktop-view {
    max-width: 1200px;
    margin: 0 auto;
    
    .movie-poster {
      img {
        width: 100%;
        border-radius: 8px;
      }
    }
    
    .movie-info {
      h1 {
        margin-bottom: 20px;
      }
      
      .play-times {
        color: #666;
        margin: 20px 0;
      }
      
      .description {
        color: #333;
        line-height: 1.8;
        margin: 20px 0;
      }
    }
    
    .episodes {
      margin-top: 30px;
      
      h3 {
        margin-bottom: 15px;
      }
      
      .episode-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 10px;
      }
    }
  }
}
</style>