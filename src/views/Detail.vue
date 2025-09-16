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
      
      <!-- 播放源切换 -->
      <div v-if="sources.length > 1" class="sources">
        <h3>播放源</h3>
        <div class="source-list">
          <van-button
            v-for="(source, index) in sources"
            :key="index"
            size="small"
            :type="currentSource === index ? 'primary' : 'default'"
            @click="switchSource(index)"
          >
            播放源{{ index + 1 }}
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
          
          <!-- 播放源切换 -->
          <div v-if="sources.length > 1" class="sources">
            <h3>播放源</h3>
            <div class="source-list">
              <el-button
                v-for="(source, index) in sources"
                :key="index"
                :type="currentSource === index ? 'primary' : 'default'"
                @click="switchSource(index)"
              >
                播放源{{ index + 1 }}
              </el-button>
            </div>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { movieApi } from '@/api/movie'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()

const movieInfo = ref(null)
const episodes = ref([])
const sources = ref([])
const currentSource = ref(0)

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
      episodes.value = []
      sources.value = []
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
      // 如果解析失败，设置为空数组
      episodes.value = []
      sources.value = []
    }
  }
}

const switchSource = (index: number) => {
  currentSource.value = index
  episodes.value = sources.value[index]
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
    
    .sources {
      margin-bottom: 20px;
      
      h3 {
        margin-bottom: 10px;
      }
      
      .source-list {
        display: flex;
        gap: 10px;
      }
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
    
    .sources {
      margin: 20px 0;
      
      h3 {
        margin-bottom: 15px;
      }
      
      .source-list {
        display: flex;
        gap: 10px;
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