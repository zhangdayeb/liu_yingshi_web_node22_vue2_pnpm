<template>
  <div class="detail-page" v-if="movieInfo">
    <!-- 移动端 -->
    <div v-if="deviceStore.isMobile" class="mobile-view">
      <!-- 顶部导航栏 -->
      <van-nav-bar
        :title="movieInfo.video_title"
        left-arrow
        @click-left="goBack"
      />
      
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
        v-if="episodes.length > 0"
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
            线路{{ index + 1 }}
          </van-button>
        </div>
      </div>
      
      <!-- 无播放源提示 -->
      <div v-if="movieInfo && episodes.length === 0" class="no-source-tip">
        <van-empty description="暂无可播放的M3U8视频源" />
      </div>
    </div>
    
    <!-- PC端 -->
    <div v-else class="desktop-view">
      <!-- 顶部导航栏 -->
      <div class="desktop-header">
        <el-button 
          type="primary" 
          plain
          @click="goBack"
        >
          <el-icon class="el-icon--left"><Back /></el-icon>
          返回
        </el-button>
        <el-button 
          type="info" 
          plain
          @click="goHome"
        >
          <el-icon class="el-icon--left"><HomeFilled /></el-icon>
          返回首页
        </el-button>
      </div>
      
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
            
            <el-button 
              v-if="episodes.length > 0"
              type="primary" 
              size="large" 
              @click="goPlayer"
            >
              <el-icon class="el-icon--left"><VideoPlay /></el-icon>
              立即播放
            </el-button>
            
            <el-tag v-else type="danger">
              暂无可播放的M3U8视频源
            </el-tag>
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
                线路{{ index + 1 }}
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
import { Back, HomeFilled, VideoPlay } from '@element-plus/icons-vue'

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

/**
 * 返回上一页
 */
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

/**
 * 返回首页
 */
const goHome = () => {
  router.push('/')
}

/**
 * 加载影片信息
 */
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

/**
 * 解析视频信息（只保留M3U8格式）
 */
const parseVideoInfo = (videoInfo: string) => {
  console.log('========== 解析视频源 ==========')
  
  // 重置数据
  sources.value = []
  episodes.value = []
  
  // 检查是否是 JSON 格式
  try {
    const jsonData = JSON.parse(videoInfo)
    if (Array.isArray(jsonData)) {
      // 过滤只保留M3U8格式
      const m3u8Episodes = jsonData.filter(item => 
        item.url && item.url.includes('.m3u8')
      )
      if (m3u8Episodes.length > 0) {
        episodes.value = m3u8Episodes
        sources.value = [m3u8Episodes]
      }
    }
  } catch {
    // 自定义格式解析：第01集$url#第02集$url 或 多个源用 $$$ 分隔
    const sourceStrings = videoInfo.split('$$$')
    
    sourceStrings.forEach((sourceStr, index) => {
      const episodeList = []
      
      if (sourceStr.includes('#')) {
        // 多集
        sourceStr.split('#').forEach(item => {
          const [name, url] = item.split('$')
          // 只保留M3U8格式
          if (url && url.includes('.m3u8')) {
            episodeList.push({ 
              name: name || '未命名', 
              url: url.trim() 
            })
          }
        })
      } else if (sourceStr.includes('$')) {
        // 单集
        const [name, ...urlParts] = sourceStr.split('$')
        const url = urlParts.join('$')
        // 只保留M3U8格式
        if (url && url.includes('.m3u8')) {
          episodeList.push({ 
            name: name || '正片', 
            url: url.trim() 
          })
        }
      } else if (sourceStr.includes('.m3u8')) {
        // 直接URL且是M3U8
        episodeList.push({ 
          name: '正片', 
          url: sourceStr.trim() 
        })
      }
      
      // 只添加有M3U8视频的源
      if (episodeList.length > 0) {
        sources.value.push(episodeList)
      }
    })
    
    // 设置第一个源为当前源
    if (sources.value.length > 0) {
      episodes.value = sources.value[0]
      console.log(`找到 ${sources.value.length} 个M3U8源`)
    }
  }
}

/**
 * 切换播放源
 */
const switchSource = (index: number) => {
  currentSource.value = index
  episodes.value = sources.value[index]
}

/**
 * 跳转播放器
 */
const goPlayer = () => {
  router.push(`/player/${route.params.id}`)
}

/**
 * 播放指定剧集
 */
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
    
    .sources, .episodes {
      margin-bottom: 20px;
      
      h3 {
        margin-bottom: 10px;
        font-size: 16px;
      }
      
      .source-list {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .episode-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
    }
    
    .no-source-tip {
      padding: 40px 20px;
      text-align: center;
    }
  }
  
  .desktop-view {
    max-width: 1200px;
    margin: 0 auto;
    
    .desktop-header {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e4e7ed;
      
      .el-button {
        margin-right: 10px;
      }
    }
    
    .movie-poster {
      img {
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
      }
    }
    
    .movie-info {
      h1 {
        margin-bottom: 20px;
        font-size: 28px;
      }
      
      .play-times {
        color: #666;
        margin: 20px 0;
        font-size: 14px;
      }
      
      .description {
        color: #333;
        line-height: 1.8;
        margin: 20px 0;
        font-size: 15px;
      }
    }
    
    .sources, .episodes {
      margin-top: 30px;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 8px;
      
      h3 {
        margin-bottom: 15px;
        font-size: 16px;
        color: #333;
      }
      
      .source-list {
        display: flex;
        gap: 10px;
      }
      
      .episode-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 10px;
        
        @media (max-width: 1200px) {
          grid-template-columns: repeat(6, 1fr);
        }
      }
    }
  }
}
</style>