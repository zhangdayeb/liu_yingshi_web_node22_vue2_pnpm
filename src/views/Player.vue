<template>
  <div class="player-page">
    <!-- 视频播放器 -->
    <div class="player-container">
      <video 
        ref="videoRef"
        class="video-element"
        controls
        autoplay
        :poster="movieInfo?.video_img_url"
      ></video>
    </div>
    
    <!-- 视频信息 -->
    <div class="player-info">
      <h2>{{ movieInfo?.video_title || '加载中...' }}</h2>
      
      <!-- 剧集选择 -->
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
      
      <!-- 播放源选择（只显示M3U8源） -->
      <div v-if="sources.length > 1" class="source-selector">
        <h3>播放源</h3>
        <div class="source-list">
          <button
            v-for="(source, index) in sources"
            :key="index"
            :class="{ active: currentSource === index }"
            @click="switchSource(index)"
          >
            线路{{ index + 1 }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { movieApi } from '@/api/movie'

// 路由
const route = useRoute()

// DOM引用
const videoRef = ref<HTMLVideoElement>(null)

// HLS实例
let hls = null

// 数据
const movieInfo = ref(null)
const episodes = ref([])  // 当前播放源的剧集列表
const sources = ref([])   // 所有M3U8播放源
const currentEpisode = ref(0)
const currentSource = ref(0)

// 生命周期
onMounted(() => {
  init()
})

onUnmounted(() => {
  destroyHls()
})

/**
 * 初始化
 */
async function init() {
  const movieId = route.params.id
  const episodeIndex = parseInt(route.query.episode) || 0
  
  console.log('========== 播放器初始化 ==========')
  console.log('影片ID:', movieId)
  console.log('剧集索引:', episodeIndex)
  
  // 加载影片信息
  await loadMovieInfo(movieId)
  
  // 设置当前剧集
  currentEpisode.value = episodeIndex
  
  // 记录播放日志
  movieApi.addPlayLog(movieId).catch(err => {
    console.error('记录播放日志失败:', err)
  })
}

/**
 * 加载影片信息
 */
async function loadMovieInfo(movieId: string) {
  try {
    console.log('正在加载影片信息...')
    const response = await movieApi.getInfo(movieId)
    
    if (response.code !== 200 || !response.data) {
      throw new Error('获取影片信息失败')
    }
    
    movieInfo.value = response.data
    console.log('影片标题:', response.data.video_title)
    console.log('原始video_info:', response.data.video_info)
    
    // 解析视频源
    if (response.data.video_info) {
      parseVideoSources(response.data.video_info)
    } else {
      console.error('没有找到video_info数据')
      alert('该影片暂无播放源')
    }
  } catch (error) {
    console.error('加载影片信息失败:', error)
    alert('加载影片信息失败，请刷新重试')
  }
}

/**
 * 解析视频源（只保留M3U8格式）
 */
function parseVideoSources(videoInfo: string) {
  console.log('========== 解析视频源 ==========')
  
  // 重置数据
  sources.value = []
  episodes.value = []
  
  // 分割多个源（用$$$分隔）
  const sourceStrings = videoInfo.split('$$$')
  console.log(`找到 ${sourceStrings.length} 个源`)
  
  // 解析每个源
  sourceStrings.forEach((sourceStr, index) => {
    console.log(`\n源 ${index + 1}: ${sourceStr.substring(0, 50)}...`)
    
    const episodeList = []
    
    // 检查是否包含多集（用#分隔）
    if (sourceStr.includes('#')) {
      // 多集格式：第01集$url#第02集$url
      const items = sourceStr.split('#')
      items.forEach(item => {
        const [name, url] = item.split('$')
        if (url && url.includes('.m3u8')) {
          episodeList.push({ name: name || '未命名', url: url.trim() })
          console.log(`  ✅ 剧集: ${name}`)
        }
      })
    } else if (sourceStr.includes('$')) {
      // 单集格式：正片$url
      const [name, ...urlParts] = sourceStr.split('$')
      const url = urlParts.join('$')  // 处理URL中可能包含的$
      if (url && url.includes('.m3u8')) {
        episodeList.push({ name: name || '正片', url: url.trim() })
        console.log(`  ✅ 单集: ${name}`)
      } else {
        console.log(`  ❌ 非M3U8格式，跳过`)
      }
    } else if (sourceStr.includes('.m3u8')) {
      // 只有URL
      episodeList.push({ name: '正片', url: sourceStr.trim() })
      console.log(`  ✅ 直接URL`)
    }
    
    // 只添加包含M3U8视频的源
    if (episodeList.length > 0) {
      sources.value.push(episodeList)
    }
  })
  
  console.log(`\n有效的M3U8源: ${sources.value.length} 个`)
  
  // 设置第一个源为当前源
  if (sources.value.length > 0) {
    episodes.value = sources.value[0]
    console.log(`当前源包含 ${episodes.value.length} 个剧集`)
    
    // 播放第一个剧集
    if (episodes.value.length > 0) {
      playVideo(episodes.value[0].url)
    }
  } else {
    console.error('没有找到有效的M3U8播放源')
    alert('该影片暂无可播放的M3U8源')
  }
}

/**
 * 播放M3U8视频
 */
function playVideo(url: string) {
  console.log('========== 播放视频 ==========')
  console.log('URL:', url)
  
  if (!url || !url.includes('.m3u8')) {
    console.error('无效的M3U8地址')
    return
  }
  
  const video = videoRef.value
  if (!video) {
    console.error('视频元素未找到')
    return
  }
  
  // 销毁旧的HLS实例
  destroyHls()
  
  // 检查浏览器支持
  if (window.Hls && window.Hls.isSupported()) {
    console.log('使用 HLS.js 播放')
    
    // 创建新的HLS实例
    hls = new window.Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      maxBufferSize: 60 * 1000 * 1000,
    })
    
    // 加载视频
    hls.loadSource(url)
    hls.attachMedia(video)
    
    // 监听事件
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ M3U8清单解析成功')
      video.play().then(() => {
        console.log('✅ 开始播放')
      }).catch(err => {
        console.log('⚠️ 自动播放被阻止，需要用户手动点击播放')
      })
    })
    
    hls.on(window.Hls.Events.ERROR, (event, data) => {
      console.error('❌ HLS错误:', data)
      if (data.fatal) {
        handleFatalError(data)
      }
    })
    
    hls.on(window.Hls.Events.LEVEL_LOADED, (event, data) => {
      console.log('加载完成 - 时长:', data.details.totalduration, '秒')
    })
    
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari/iOS 原生支持
    console.log('使用浏览器原生HLS支持')
    video.src = url
    video.play().catch(err => {
      console.log('播放失败:', err.message)
    })
  } else {
    console.error('浏览器不支持HLS播放')
    alert('您的浏览器不支持M3U8视频播放')
  }
}

/**
 * 处理HLS致命错误
 */
function handleFatalError(data: any) {
  switch(data.type) {
    case window.Hls.ErrorTypes.NETWORK_ERROR:
      console.log('网络错误，尝试恢复...')
      hls.startLoad()
      break
    case window.Hls.ErrorTypes.MEDIA_ERROR:
      console.log('媒体错误，尝试恢复...')
      hls.recoverMediaError()
      break
    default:
      console.error('无法恢复的错误')
      alert('视频加载失败，请尝试切换播放源')
      break
  }
}

/**
 * 销毁HLS实例
 */
function destroyHls() {
  if (hls) {
    console.log('销毁HLS实例')
    hls.destroy()
    hls = null
  }
}

/**
 * 切换剧集
 */
function switchEpisode(index: number) {
  console.log(`切换到剧集 ${index + 1}`)
  currentEpisode.value = index
  
  if (episodes.value[index]) {
    playVideo(episodes.value[index].url)
  }
}

/**
 * 切换播放源
 */
function switchSource(index: number) {
  console.log(`切换到播放源 ${index + 1}`)
  currentSource.value = index
  currentEpisode.value = 0
  
  // 更新剧集列表
  episodes.value = sources.value[index]
  
  // 播放第一个剧集
  if (episodes.value[0]) {
    playVideo(episodes.value[0].url)
  }
}
</script>

<style lang="scss" scoped>
.player-page {
  width: 100%;
  min-height: 100vh;
  background: #000;
  
  .player-container {
    width: 100%;
    height: 60vh;
    background: #000;
    
    @media (max-width: 768px) {
      height: 40vh;
    }
    
    .video-element {
      width: 100%;
      height: 100%;
      background: #000;
      outline: none;
      
      &:focus {
        outline: none;
      }
    }
  }
  
  .player-info {
    padding: 20px;
    background: #1a1a1a;
    color: #fff;
    
    h2 {
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: normal;
    }
    
    .episode-selector,
    .source-selector {
      margin-bottom: 20px;
      
      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #999;
        font-weight: normal;
      }
      
      .episode-list,
      .source-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        button {
          padding: 8px 16px;
          border: 1px solid #333;
          background: transparent;
          color: #ccc;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          transition: all 0.2s;
          
          &:hover {
            border-color: #409eff;
            color: #409eff;
          }
          
          &.active {
            background: #409eff;
            border-color: #409eff;
            color: #fff;
          }
        }
      }
    }
  }
}
</style>