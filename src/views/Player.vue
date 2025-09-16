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
      
      <!-- 播放源切换 -->
      <div v-if="sources.length > 1" class="source-selector">
        <h3>播放源</h3>
        <div class="source-list">
          <button
            v-for="(source, index) in sources"
            :key="index"
            :class="{ active: currentSource === index }"
            @click="switchSource(index)"
          >
            播放源{{ index + 1 }}
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
const sources = ref([])
const currentEpisode = ref(0)
const currentSource = ref(0)
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
      parseVideoInfo(movieInfo.value.video_info)
    }
  } catch (error) {
    console.error('加载影片信息失败:', error)
  }
}

const parseVideoInfo = (videoInfo: string) => {
  // 处理 m3u8 格式的视频信息
  
  // 检查是否是 JSON 格式（向后兼容）
  try {
    const jsonData = JSON.parse(videoInfo)
    if (Array.isArray(jsonData)) {
      episodes.value = jsonData
      sources.value = [jsonData] // 单个播放源
    } else {
      episodes.value = [{ name: '正片', url: videoInfo }]
      sources.value = [[{ name: '正片', url: videoInfo }]]
    }
  } catch {
    // 不是 JSON，按照自定义格式解析
    // 格式：第01集$url#第02集$url 或者有多个播放源用 $$$ 分隔
    
    // 先分离不同的播放源
    const sourcesArray = videoInfo.split('$$$')
    sources.value = []
    
    sourcesArray.forEach((sourceStr, sourceIndex) => {
      const episodesForSource = []
      
      if (sourceStr.includes('#')) {
        // 多集
        sourceStr.split('#').forEach(item => {
          const [name, url] = item.split('$')
          if (url && url.trim()) {
            episodesForSource.push({
              name: name || '未命名',
              url: url.trim()
            })
          }
        })
      } else if (sourceStr.includes('$')) {
        // 单集，但有名称
        const [name, url] = sourceStr.split('$')
        if (url && url.trim()) {
          episodesForSource.push({
            name: name || '正片',
            url: url.trim()
          })
        }
      } else if (sourceStr.trim()) {
        // 只有URL，没有名称
        episodesForSource.push({
          name: '正片',
          url: sourceStr.trim()
        })
      }
      
      if (episodesForSource.length > 0) {
        sources.value.push(episodesForSource)
      }
    })
    
    // 设置第一个播放源的剧集列表为当前剧集
    if (sources.value.length > 0) {
      episodes.value = sources.value[0]
    } else {
      // 如果解析失败，设置默认值
      episodes.value = [{ name: '正片', url: '' }]
      sources.value = [[{ name: '正片', url: '' }]]
    }
  }
}

const updateVideoUrl = () => {
  if (sources.value.length > currentSource.value && 
      sources.value[currentSource.value].length > currentEpisode.value) {
    currentVideoUrl.value = sources.value[currentSource.value][currentEpisode.value].url
  }
}

const switchEpisode = (index: number) => {
  currentEpisode.value = index
  updateVideoUrl()
}

const switchSource = (index: number) => {
  currentSource.value = index
  episodes.value = sources.value[index]
  // 切换源时，重置到第一集
  currentEpisode.value = 0
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
    
    .episode-selector, .source-selector {
      margin-bottom: 20px;
      
      h3 {
        margin-bottom: 10px;
      }
      
      .episode-list, .source-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        
        button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;
          
          &.active {
            background: #409eff;
            color: #fff;
            border-color: #409eff;
          }
          
          &:hover:not(.active) {
            border-color: #409eff;
            color: #409eff;
          }
        }
      }
    }
  }
}
</style>