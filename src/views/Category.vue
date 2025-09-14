<template>
  <div class="category-page">
    <!-- 移动端 -->
    <div v-if="deviceStore.isMobile" class="mobile-view">
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
        <el-aside width="200px" class="category-sidebar">
          <el-menu
            :default-active="String(selectedCategory)"
            @select="handleSelect"
          >
            <el-menu-item index="0">
              <span>全部分类</span>
            </el-menu-item>
            <el-sub-menu
              v-for="parent in parentCategories"
              :key="parent.id"
              :index="String(parent.id)"
            >
              <template #title>
                <span>{{ parent.name }}</span>
              </template>
              <el-menu-item
                v-for="child in parent.children"
                :key="child.id"
                :index="String(child.id)"
              >
                {{ child.name }}
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        
        <el-main>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { useMovieStore } from '@/stores/movie'
import MovieCard from '@/components/MovieCard.vue'

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

// 处理分类树形数据
const parentCategories = computed(() => {
  return categories.value.filter(cat => cat.pid === 0)
})

const treeItems = computed(() => {
  return parentCategories.value.map(parent => ({
    text: parent.name,
    children: categories.value
      .filter(cat => cat.pid === parent.id)
      .map(child => ({
        text: child.name,
        id: child.id
      }))
  }))
})

onMounted(async () => {
  await movieStore.fetchCategories()
  await loadMovies()
})

const loadMovies = async (append = false) => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    type_id: selectedCategory.value
  }
  
  await movieStore.fetchMovieList(params, append)
  total.value = movieStore.total
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
  router.push(`/detail/${id}`)
}
</script>

<style lang="scss" scoped>
.category-page {
  height: 100%;
  
  .mobile-view {
    display: flex;
    height: 100%;
    
    .movie-list {
      flex: 1;
      padding: 10px;
    }
  }
  
  .desktop-view {
    height: 100%;
    
    .category-sidebar {
      background: #fff;
      border-right: 1px solid #e4e7ed;
    }
    
    .movie-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 20px;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
  }
}
</style>