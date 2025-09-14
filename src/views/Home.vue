<template>
  <div class="home-page">
    <!-- 移动端视图 -->
    <div v-if="deviceStore.isMobile" class="mobile-view">
      <!-- 搜索栏 -->
      <van-search
        v-model="searchKeyword"
        placeholder="搜索影片"
        @search="handleSearch"
      />
      
      <!-- 分类标签 -->
      <div class="category-tabs">
        <van-tabs v-model:active="activeTab" @change="handleTabChange">
          <van-tab title="全部" name="0" />
          <van-tab 
            v-for="cat in categories" 
            :key="cat.id"
            :title="cat.name"
            :name="cat.id"
          />
        </van-tabs>
      </div>
      
      <!-- 影片列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="movie-grid">
            <MovieCard
              v-for="movie in movieList"
              :key="movie.id"
              :movie="movie"
              @click="goDetail(movie.id)"
            />
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
    
    <!-- PC端视图 -->
    <div v-else class="desktop-view">
      <el-container>
        <!-- 搜索和筛选 -->
        <el-header height="60px" class="header">
          <el-row :gutter="20" align="middle">
            <el-col :span="8">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索影片"
                @keyup.enter="handleSearch"
                clearable
              >
                <template #append>
                  <el-button @click="handleSearch">搜索</el-button>
                </template>
              </el-input>
            </el-col>
            <el-col :span="8">
              <el-select 
                v-model="selectedCategory" 
                placeholder="选择分类"
                @change="handleCategoryChange"
                clearable
              >
                <el-option label="全部" :value="0" />
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-radio-group v-model="sortType" @change="handleSortChange">
                <el-radio-button label="latest">最新</el-radio-button>
                <el-radio-button label="hottest">最热</el-radio-button>
              </el-radio-group>
            </el-col>
          </el-row>
        </el-header>
        
        <!-- 影片网格 -->
        <el-main>
          <div class="movie-grid-desktop" v-loading="loading">
            <MovieCard
              v-for="movie in movieList"
              :key="movie.id"
              :movie="movie"
              @click="goDetail(movie.id)"
            />
          </div>
          
          <!-- 分页 -->
          <el-pagination
            v-if="total > 0"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next, total"
            @current-change="handlePageChange"
            class="pagination"
          />
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { useMovieStore } from '@/stores/movie'
import MovieCard from '@/components/MovieCard.vue'

const router = useRouter()
const deviceStore = useDeviceStore()
const movieStore = useMovieStore()

// 搜索相关
const searchKeyword = ref('')
const activeTab = ref('0')
const selectedCategory = ref(0)
const sortType = ref('latest')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

// 数据
const categories = computed(() => movieStore.categories)
const movieList = computed(() => movieStore.movieList)

// 初始化
onMounted(async () => {
  await movieStore.fetchCategories()
  await loadMovies()
})

// 加载影片
const loadMovies = async (append = false) => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    type_id: selectedCategory.value || activeTab.value,
    keyword: searchKeyword.value,
    sort: sortType.value
  }
  
  await movieStore.fetchMovieList(params, append)
}

// 移动端下拉刷新
const onRefresh = async () => {
  currentPage.value = 1
  await loadMovies()
  refreshing.value = false
}

// 移动端上拉加载
const onLoad = async () => {
  if (!movieStore.hasMore) {
    finished.value = true
    return
  }
  
  currentPage.value++
  await loadMovies(true)
  loading.value = false
  
  if (!movieStore.hasMore) {
    finished.value = true
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  movieStore.resetList()
  loadMovies()
}

// 分类切换
const handleTabChange = (name: string) => {
  selectedCategory.value = parseInt(name)
  currentPage.value = 1
  movieStore.resetList()
  loadMovies()
}

const handleCategoryChange = () => {
  currentPage.value = 1
  movieStore.resetList()
  loadMovies()
}

// 排序切换
const handleSortChange = () => {
  currentPage.value = 1
  movieStore.resetList()
  loadMovies()
}

// PC端分页
const handlePageChange = () => {
  loadMovies()
}

// 跳转详情
const goDetail = (id: number) => {
  router.push(`/detail/${id}`)
}
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  
  .mobile-view {
    .category-tabs {
      background: #fff;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .movie-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 10px;
    }
  }
  
  .desktop-view {
    .header {
      background: #fff;
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid #e4e7ed;
    }
    
    .movie-grid-desktop {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      padding: 20px;
      
      @media (max-width: 1400px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
  }
}
</style>