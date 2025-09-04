import { defineStore } from 'pinia'
import { ref } from 'vue'
import { movieApi } from '@/api/movie'

export const useMovieStore = defineStore('movie', () => {
  const categories = ref([])
  const currentCategory = ref(null)
  const movieList = ref([])
  const loading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  
  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const res = await movieApi.getTypeList()
      categories.value = res.data
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }
  
  // 获取影片列表
  const fetchMovieList = async (params = {}, append = false) => {
    loading.value = true
    try {
      const res = await movieApi.getList({
        page: currentPage.value,
        limit: 20,
        ...params
      })
      
      if (append) {
        movieList.value = [...movieList.value, ...res.data.list]
      } else {
        movieList.value = res.data.list
      }
      
      hasMore.value = res.data.list.length === 20
    } catch (error) {
      console.error('获取影片列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  // 重置列表
  const resetList = () => {
    movieList.value = []
    currentPage.value = 1
    hasMore.value = true
  }
  
  return {
    categories,
    currentCategory,
    movieList,
    loading,
    hasMore,
    currentPage,
    fetchCategories,
    fetchMovieList,
    resetList
  }
})