<template>
  <div class="category-page">
    <!-- 移动端 -->
    <div v-if="deviceStore.isMobile" class="mobile-view">
      <!-- 顶部导航栏 -->
      <van-nav-bar
        title="分类浏览"
        left-arrow
        @click-left="goHome"
      />
      
      <van-tree-select
        v-model:active-id="activeIds"
        v-model:main-active-index="activeIndex"
        :items="treeItems"
        @click-nav="onNavClick"
        @click-item="onItemClick"
      />
      
      <div class="movie-list">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          @load="onLoad"
        >
          <MovieCard
            v-for="movie in movieList"
            :key="movie.id"
            :movie="movie"
            @click="goDetail(movie.id)"
          />
        </van-list>
      </div>
    </div>
    
    <!-- PC端 -->
    <div v-else class="desktop-view">
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="category-header">
          <div class="header-content">
            <el-button 
              type="primary"
              plain
              @click="goHome"
              class="back-button"
            >
              <el-icon class="el-icon--left"><HomeFilled /></el-icon>
              返回首页
            </el-button>
            <h1 class="page-title">分类浏览</h1>
          </div>
        </el-header>
        
        <el-container>
          <el-aside width="200px" class="category-sidebar">
            <el-menu
              :default-active="String(selectedCategory)"
              @select="handleSelect"
            >
              <el-menu-item index="0">
                <el-icon><Grid /></el-icon>
                <span>全部分类</span>
              </el-menu-item>
              <el-sub-menu
                v-for="parent in parentCategories"
                :key="parent.id"
                :index="String(parent.id)"
              >
                <template #title>
                  <el-icon><Folder /></el-icon>
                  <span>{{ parent.name }}</span>
                </template>
                <el-menu-item
                  v-for="child in parent.children"
                  :key="child.id"
                  :index="String(child.id)"
                >
                  <el-icon><Document /></el-icon>
                  {{ child.name }}
                </el-menu-item>
              </el-sub-menu>
            </el-menu>
          </el-aside>
          
          <el-main>
            <!-- 当前分类信息 -->
            <div class="category-info">
              <h2>{{ currentCategoryName }}</h2>
              <el-tag v-if="selectedCategory !== 0">
                共 {{ total }} 部影片
              </el-tag>
            </div>
            
            <div class="movie-grid" v-loading="loading">
              <MovieCard
                v-for="movie in movieList"
                :key="movie.id"
                :movie="movie"
                @click="goDetail(movie.id)"
              />
            </div>
            
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
      </el-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { useMovieStore } from '@/stores/movie'
import MovieCard from '@/components/MovieCard.vue'
import { HomeFilled, Grid, Folder, Document } from '@element-plus/icons-vue'

const router = useRouter()
const deviceStore = useDeviceStore()
const movieStore = useMovieStore()

const selectedCategory = ref(0)
const activeIndex = ref(0)
const activeIds = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

const categories = computed(() => movieStore.categories)
const movieList = computed(() => movieStore.movieList)

// 获取当前分类名称
const currentCategoryName = computed(() => {
  if (selectedCategory.value === 0) {
    return '全部分类'
  }
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat ? cat.name : '全部分类'
})

// 处理分类树形数据
const parentCategories = computed(() => {
  const parents = categories.value.filter(cat => cat.pid === 0)
  return parents.map(parent => ({
    ...parent,
    children: categories.value.filter(cat => cat.pid === parent.id)
  }))
})

const treeItems = computed(() => {
  return parentCategories.value.map(parent => ({
    text: parent.name,
    children: parent.children.map(child => ({
      text: child.name,
      id: child.id
    }))
  }))
})

onMounted(async () => {
  await movieStore.fetchCategories()
  await loadMovies()
})

/**
 * 返回首页
 */
const goHome = () => {
  router.push('/')
}

const loadMovies = async (append = false) => {
  loading.value = true
  
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    type_id: selectedCategory.value
  }
  
  try {
    await movieStore.fetchMovieList(params, append)
    total.value = movieStore.total
  } finally {
    loading.value = false
  }
}

const onNavClick = (index: number) => {
  activeIndex.value = index
}

const onItemClick = (item: any) => {
  selectedCategory.value = item.id
  currentPage.value = 1
  movieStore.resetList()
  loadMovies()
}

const handleSelect = (index: string) => {
  selectedCategory.value = parseInt(index)
  currentPage.value = 1
  movieStore.resetList()
  loadMovies()
}

const handlePageChange = () => {
  loadMovies()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onLoad = async () => {
  if (!movieStore.hasMore) {
    finished.value = true
    return
  }
  
  currentPage.value++
  await loadMovies(true)
  loading.value = false
}

const goDetail = (id: number) => {
  // 标记从分类页进入，方便详情页返回
  router.push({
    path: `/detail/${id}`,
    query: { from: 'category' }
  })
}
</script>

<style lang="scss" scoped>
.category-page {
  height: 100%;
  
  .mobile-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    
    :deep(.van-nav-bar) {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    :deep(.van-tree-select) {
      flex-shrink: 0;
    }
    
    .movie-list {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
    }
  }
  
  .desktop-view {
    height: 100%;
    
    .category-header {
      background: #fff;
      border-bottom: 2px solid #e4e7ed;
      padding: 0 20px;
      height: 60px !important;
      
      .header-content {
        display: flex;
        align-items: center;
        height: 100%;
        
        .back-button {
          margin-right: 20px;
        }
        
        .page-title {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
    
    .category-sidebar {
      background: #fff;
      border-right: 1px solid #e4e7ed;
      overflow-y: auto;
      
      :deep(.el-menu) {
        border-right: none;
        
        .el-menu-item {
          height: 45px;
          line-height: 45px;
          
          &.is-active {
            background: #ecf5ff;
            color: #409eff;
            
            .el-icon {
              color: #409eff;
            }
          }
        }
        
        .el-sub-menu__title {
          height: 50px;
          line-height: 50px;
        }
      }
    }
    
    .category-info {
      padding: 20px;
      background: #f5f7fa;
      margin-bottom: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      h2 {
        margin: 0;
        font-size: 18px;
        color: #303133;
      }
    }
    
    .movie-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      padding: 0 20px 20px 20px;
      min-height: 400px;
      
      @media (max-width: 1600px) {
        grid-template-columns: repeat(4, 1fr);
      }
      
      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
      }
      
      @media (max-width: 992px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      padding: 20px;
      background: #fff;
      border-top: 1px solid #e4e7ed;
      
      :deep(.el-pagination) {
        .el-pager li,
        .btn-prev,
        .btn-next {
          background-color: #fff;
          border: 1px solid #dcdfe6;
          
          &:hover:not(.is-disabled):not(.active) {
            color: #409eff;
          }
          
          &.active {
            background-color: #409eff;
            color: #fff;
            border-color: #409eff;
          }
          
          &.is-disabled {
            color: #c0c4cc;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}
</style>