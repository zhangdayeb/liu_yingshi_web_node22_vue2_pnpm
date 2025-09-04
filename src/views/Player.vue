<template>
  <div class="player-page">
    <div class="player-container">
      <VideoPlayer 
        :url="currentVideoUrl" 
        :title="movieInfo?.video_title"
      />
    </div>
    
    <div class="player-info">
      <h2>{{ movieInfo?.video_title }}</h2>
      
      <!-- 剧集切换 -->
      <div v-if="episodes.length > 1" class="episode-selector">
        <h3>选集</h3>
        <div class="episode-list">
          <button
            v-for="(ep, index) in episodes"
            :key="index"
            :class="{ active: currentEpisode === index }"
            @click="switchEpisode(index)"
          >
            {{ ep.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { movieApi } from '@/api/movie'
import VideoPlayer from '@/components/VideoPlayer.vue'

const route = useRoute()

const movieInfo = ref(null)
const episodes = ref([])
const currentEpisode = ref(0)
const currentVideoUrl = ref('')

onMounted(async () => {
  const id = route.params.id
  const episode = route.query.episode || 0
  
  await loadMovieInfo(id)
  currentEpisode.value = parseInt(episode)
  updateVideoUrl()
  
  // 记录播放日志
  await movieApi.addPlayLog(id)
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
        episodes.value = [{ name: '正片', url: movieInfo.value.video_info }]
      }
    }
  } catch (error) {
    console.error('加载影片信息失败:', error)
  }
}

const updateVideoUrl = () => {
  if (episodes.value.length > 0) {
    currentVideoUrl.value = episodes.value[currentEpisode.value].url
  }
}

const switchEpisode = (index: number) => {
  currentEpisode.value = index
  updateVideoUrl()
}
</script>

<style lang="scss" scoped>
.player-page {
  width: 100%;
  height: 100vh;
  background: #000;
  
  .player-container {
    width: 100%;
    height: 60vh;
    
    @media (max-width: 768px) {
      height: 40vh;
    }
  }
  
  .player-info {
    padding: 20px;
    background: #fff;
    
    h2 {
      margin-bottom: 20px;
    }
    
    .episode-selector {
      h3 {
        margin-bottom: 10px;
      }
      
      .episode-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        
        button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
          border-radius: 4px;
          
          &.active {
            background: #409eff;
            color: #fff;
            border-color: #409eff;
          }
          
          &:hover {
            border-color: #409eff;
          }
        }
      }
    }
  }
}
</style>