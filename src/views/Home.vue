<template>
  <div class="home-page">
    <!-- 广告组件 -->
    <AdBanner />

    <!-- 移动端视图 -->
    <div v-if="deviceStore.isMobile" class="mobile-view">
      <!-- 搜索栏 -->
      <van-search
        v-model="searchKeyword"
        placeholder="搜索影片"
        @search="handleSearch"
      />
      
      <!-- 二级分类选择 -->
      <div class="category-selector-mobile">
        <van-dropdown-menu>
          <van-dropdown-item 
            v-model="selectedParentCategory" 
            :options="parentCategoryOptions" 
            @change="handleParentChange" 
          />
          <van-dropdown-item 
            v-model="selectedChildCategory" 
            :options="childCategoryOptions" 
            @change="handleChildChange"
            :disabled="!selectedParentCategory || selectedParentCategory === 0"
          />
        </van-dropdown-menu>
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
        <el-header height="80px" class="header">
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
            
            <!-- 二级分类联动选择 -->
            <el-col :span="10">
              <div class="category-cascader">
                <el-select 
                  v-model="selectedParentCategory" 
                  placeholder="选择分类"
                  @change="handleParentChange"
                  clearable
                  style="width: 150px; margin-right: 10px;"
                >
                  <el-option label="全部分类" :value="0" />
                  <el-option
                    v-for="cat in parentCategories"
                    :key="cat.id"
                    :label="`${cat.name} (${cat.video_count || 0})`"
                    :value="cat.id"
                  />
                </el-select>
                
                <el-select 
                  v-model="selectedChildCategory" 
                  placeholder="选择子分类"
                  @change="handleChildChange"
                  clearable
                  style="width: 150px;"
                  :disabled="!selectedParentCategory || selectedParentCategory === 0"
                >
                  <el-option label="全部" :value="0" />
                  <el-option
                    v-for="cat in childCategories"
                    :key="cat.id"
                    :label="`${cat.name} (${cat.video_count || 0})`"
                    :value="cat.id"
                  />
                </el-select>
              </div>
            </el-col>
            
            <el-col :span="6">
              <el-radio-group v-model="sortType" @change="handleSortChange">
                <el-radio-button label="latest">最新</el-radio-button>
                <el-radio-button label="hottest">最热</el-radio-button>
              </el-radio-group>
            </el-col>
          </el-row>
        </el-header>
        
        <!-- 影片网格 -->
        <el-main>
          <!-- 当前分类面包屑 -->
          <div v-if="selectedParentCategory || selectedChildCategory" class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item @click="resetCategory">全部</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentParentName">
                {{ currentParentName }}
              </el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentChildName">
                {{ currentChildName }}
              </el-breadcrumb-item>
            </el-breadcrumb>
            <el-tag 
              v-if="currentCategoryVideoCount > 0" 
              type="info" 
              size="small" 
              style="margin-left: 10px;"
            >
              共 {{ currentCategoryVideoCount }} 部
            </el-tag>
          </div>
          
          <div class="movie-grid-desktop" v-loading="loading">
            <MovieCard
              v-for="movie in movieList"
              :key="movie.id"
              :movie="movie"
              @click="goDetail(movie.id)"
            />
          </div>
          
          <!-- 空状态提示 -->
          <el-empty 
            v-if="!loading && movieList.length === 0"
            description="暂无影片"
          />
          
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
import { ref, onMounted, computed, watch, Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { useMovieStore } from '@/stores/movie'
import MovieCard from '@/components/MovieCard.vue'

// 类型定义
interface Category {
  id: number
  name: string
  pid: number
  video_count?: number
}

interface DropdownOption {
  text: string
  value: number
}

interface LoadMoviesParams {
  page?: number
  limit?: number
  type_id?: number
  keyword?: string
  sort?: string
}

// 使用stores
const router = useRouter()
const deviceStore = useDeviceStore()
const movieStore = useMovieStore()

// 搜索相关
const searchKeyword: Ref<string> = ref('')
const sortType: Ref<string> = ref('latest')

// 分类相关
const selectedParentCategory: Ref<number> = ref(0)
const selectedChildCategory: Ref<number> = ref(0)

// 分页相关
const currentPage: Ref<number> = ref(1)
const pageSize: Ref<number> = ref(20)
const loading: Ref<boolean> = ref(false)
const finished: Ref<boolean> = ref(false)
const refreshing: Ref<boolean> = ref(false)

// 从 store 获取数据
const categories = computed<Category[]>(() => movieStore.categories)
const movieList = computed(() => movieStore.movieList)
const total = computed<number>(() => movieStore.total)

// 获取父分类列表
const parentCategories = computed<Category[]>(() => {
  return categories.value.filter((cat: Category) => cat.pid === 0)
})

// 获取当前父分类下的子分类
const childCategories = computed<Category[]>(() => {
  if (!selectedParentCategory.value || selectedParentCategory.value === 0) {
    return []
  }
  
  // 使用 store 提供的辅助方法
  if (movieStore.getChildCategories) {
    return movieStore.getChildCategories(selectedParentCategory.value)
  }
  
  // 备用方案
  return categories.value.filter((cat: Category) => cat.pid === selectedParentCategory.value)
})

// 移动端下拉选项
const parentCategoryOptions = computed<DropdownOption[]>(() => {
  const options: DropdownOption[] = [{ text: '全部分类', value: 0 }]
  
  parentCategories.value.forEach((cat: Category) => {
    options.push({ 
      text: cat.video_count ? `${cat.name}(${cat.video_count})` : cat.name,
      value: cat.id 
    })
  })
  
  return options
})

const childCategoryOptions = computed<DropdownOption[]>(() => {
  if (!selectedParentCategory.value || selectedParentCategory.value === 0) {
    return [{ text: '请先选择分类', value: 0 }]
  }
  
  const options: DropdownOption[] = [{ text: '全部', value: 0 }]
  
  childCategories.value.forEach((cat: Category) => {
    options.push({ 
      text: cat.video_count ? `${cat.name}(${cat.video_count})` : cat.name,
      value: cat.id 
    })
  })
  
  return options
})

// 获取当前分类名称
const currentParentName = computed<string>(() => {
  if (!selectedParentCategory.value) return ''
  const cat = parentCategories.value.find((c: Category) => c.id === selectedParentCategory.value)
  return cat ? cat.name : ''
})

const currentChildName = computed<string>(() => {
  if (!selectedChildCategory.value) return ''
  const cat = childCategories.value.find((c: Category) => c.id === selectedChildCategory.value)
  return cat ? cat.name : ''
})

// 获取当前分类的视频数量
const currentCategoryVideoCount = computed<number>(() => {
  if (selectedChildCategory.value) {
    const cat = childCategories.value.find((c: Category) => c.id === selectedChildCategory.value)
    return cat?.video_count || 0
  }
  if (selectedParentCategory.value) {
    const cat = parentCategories.value.find((c: Category) => c.id === selectedParentCategory.value)
    return cat?.video_count || 0
  }
  return 0
})

// 监听 currentPage 变化
watch(currentPage, (newPage: number) => {
  movieStore.currentPage = newPage
})

// 初始化
onMounted(async () => {
  console.log('========== 首页初始化 ==========')
  await movieStore.fetchCategories()
  console.log('分类加载完成，总数:', categories.value.length)
  console.log('父分类:', parentCategories.value.length, '个')
  console.log('扁平化分类数据:', categories.value)
  
  await loadMovies()
})

// 加载影片
const loadMovies = async (append: boolean = false): Promise<void> => {
  loading.value = true
  
  // 使用子分类ID，如果没有选择子分类则使用父分类ID
  const categoryId = selectedChildCategory.value || selectedParentCategory.value
  
  const params: LoadMoviesParams = {
    page: currentPage.value,
    limit: pageSize.value,
    type_id: categoryId,
    keyword: searchKeyword.value,
    sort: sortType.value
  }
  
  console.log('加载影片，参数:', params)
  
  try {
    await movieStore.fetchMovieList(params, append)
  } finally {
    loading.value = false
  }
}

// 处理父分类变化
const handleParentChange = (value: number): void => {
  console.log('========== 父分类变化 ==========')
  console.log('从', selectedParentCategory.value, '变为', value)
  
  // 重置子分类
  selectedChildCategory.value = 0
  
  // 打印新的子分类列表
  setTimeout(() => {
    console.log('新的子分类列表:', childCategories.value.map((c: Category) => ({
      id: c.id,
      name: c.name,
      count: c.video_count
    })))
  }, 0)
  
  // 重置分页和列表
  currentPage.value = 1
  movieStore.resetList()
  finished.value = false
  
  // 重新加载数据
  loadMovies()
}

// 处理子分类变化
const handleChildChange = (value: number): void => {
  console.log('========== 子分类变化 ==========')
  console.log('子分类ID:', value)
  
  currentPage.value = 1
  movieStore.resetList()
  finished.value = false
  
  loadMovies()
}

// 重置分类
const resetCategory = (): void => {
  selectedParentCategory.value = 0
  selectedChildCategory.value = 0
  currentPage.value = 1
  movieStore.resetList()
  finished.value = false
  loadMovies()
}

// 移动端下拉刷新
const onRefresh = async (): Promise<void> => {
  currentPage.value = 1
  movieStore.resetList()
  finished.value = false
  await loadMovies()
  refreshing.value = false
}

// 移动端上拉加载
const onLoad = async (): Promise<void> => {
  if (!movieStore.hasMore) {
    finished.value = true
    return
  }
  
  currentPage.value++
  await loadMovies(true)
  
  if (!movieStore.hasMore) {
    finished.value = true
  }
}

// 搜索
const handleSearch = (): void => {
  currentPage.value = 1
  movieStore.resetList()
  finished.value = false
  loadMovies()
}

// 排序切换
const handleSortChange = (): void => {
  currentPage.value = 1
  movieStore.resetList()
  finished.value = false
  loadMovies()
}

// PC端分页
const handlePageChange = (page: number): void => {
  currentPage.value = page
  loadMovies()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转详情
const goDetail = (id: number): void => {
  router.push(`/detail/${id}`)
}
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  
  .mobile-view {
    .category-selector-mobile {
      background: #fff;
      position: sticky;
      top: 0;
      z-index: 10;
      
      :deep(.van-dropdown-menu) {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        
        .van-dropdown-menu__title {
          &.van-dropdown-menu__title--disabled {
            color: #c8c9cc;
          }
        }
      }
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
      
      .category-cascader {
        display: flex;
        align-items: center;
      }
    }
    
    .breadcrumb {
      padding: 15px 20px;
      background: #f5f7fa;
      margin-bottom: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      
      :deep(.el-breadcrumb) {
        font-size: 14px;
        
        .el-breadcrumb__item {
          cursor: pointer;
          
          &:hover {
            color: #409eff;
          }
          
          &:last-child {
            font-weight: bold;
            color: #303133;
            cursor: default;
          }
        }
      }
    }
    
    .movie-grid-desktop {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      padding: 0 20px 20px;
      min-height: 400px;
      
      @media (max-width: 1400px) {
        grid-template-columns: repeat(4, 1fr);
      }
      
      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      padding: 20px;
      
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
        }
      }
    }
  }
}
</style>