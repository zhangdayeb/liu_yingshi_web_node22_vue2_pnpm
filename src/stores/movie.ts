import { defineStore } from 'pinia'
import { ref } from 'vue'
import { movieApi } from '@/api/movie'

// 分类类型定义
interface Category {
  id: number
  name: string
  pid: number
  video_count?: number
  children?: Category[]
}

// 影片类型定义
interface Movie {
  id: number
  video_title: string
  video_img_url: string
  video_describe: string
  play_times: number
  play_times_formatted?: string
  type_name?: string
  [key: string]: any
}

// API响应类型
interface MovieListResponse {
  list: Movie[]
  total: number
  page: number
  limit: number
}

export const useMovieStore = defineStore('movie', () => {
  // 状态定义
  const categories = ref<Category[]>([])  // 扁平化的分类数据
  const categoriesRaw = ref<Category[]>([])  // 原始的嵌套分类数据
  const currentCategory = ref<number | null>(null)
  const movieList = ref<Movie[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const total = ref(0)
  
  /**
   * 获取分类列表并扁平化处理
   */
  const fetchCategories = async () => {
    try {
      const res = await movieApi.getTypeList()
      
      // 保存原始数据（带children的嵌套结构）
      categoriesRaw.value = res.data || []
      
      // 扁平化处理
      const flatCategories: Category[] = []
      
      // 遍历父分类
      if (Array.isArray(res.data)) {
        res.data.forEach((parent: Category) => {
          // 添加父分类
          flatCategories.push({
            id: parent.id,
            name: parent.name,
            pid: parent.pid,
            video_count: parent.video_count
          })
          
          // 添加子分类
          if (parent.children && Array.isArray(parent.children)) {
            parent.children.forEach((child: Category) => {
              flatCategories.push({
                id: child.id,
                name: child.name,
                pid: child.pid,
                video_count: child.video_count
              })
            })
          }
        })
      }
      
      categories.value = flatCategories
      
      console.log('分类数据处理完成:')
      console.log('- 原始数据（嵌套）:', categoriesRaw.value)
      console.log('- 扁平化数据:', flatCategories)
      console.log('- 父分类数量:', flatCategories.filter(c => c.pid === 0).length)
      console.log('- 子分类数量:', flatCategories.filter(c => c.pid !== 0).length)
      
    } catch (error) {
      console.error('获取分类失败:', error)
      categories.value = []
      categoriesRaw.value = []
    }
  }
  
  /**
   * 获取影片列表
   * @param params 查询参数
   * @param append 是否追加到现有列表
   */
  const fetchMovieList = async (params: any = {}, append = false) => {
    loading.value = true
    try {
      const res = await movieApi.getList({
        page: params.page || currentPage.value,
        limit: params.limit || 20,
        ...params
      })
      
      console.log('API响应:', res)
      
      // 更新总数
      if (res.data && typeof res.data.total !== 'undefined') {
        total.value = res.data.total
        console.log('设置total为:', total.value)
      }
      
      // 更新列表
      if (res.data && res.data.list) {
        if (append) {
          movieList.value = [...movieList.value, ...res.data.list]
        } else {
          movieList.value = res.data.list
        }
        
        // 判断是否还有更多数据
        hasMore.value = res.data.list.length === (params.limit || 20)
      } else {
        // 如果没有数据
        if (!append) {
          movieList.value = []
        }
        hasMore.value = false
      }
      
    } catch (error) {
      console.error('获取影片列表失败:', error)
      if (!append) {
        movieList.value = []
      }
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 根据分类ID获取分类信息
   * @param id 分类ID
   */
  const getCategoryById = (id: number): Category | undefined => {
    return categories.value.find(cat => cat.id === id)
  }
  
  /**
   * 获取指定父分类下的子分类
   * @param parentId 父分类ID
   */
  const getChildCategories = (parentId: number): Category[] => {
    return categories.value.filter(cat => cat.pid === parentId)
  }
  
  /**
   * 获取所有父分类
   */
  const getParentCategories = (): Category[] => {
    return categories.value.filter(cat => cat.pid === 0)
  }
  
  /**
   * 重置列表
   */
  const resetList = () => {
    movieList.value = []
    currentPage.value = 1
    hasMore.value = true
    total.value = 0
  }
  
  return {
    // 状态
    categories,
    categoriesRaw,
    currentCategory,
    movieList,
    loading,
    hasMore,
    currentPage,
    total,
    
    // 方法
    fetchCategories,
    fetchMovieList,
    resetList,
    
    // 辅助方法
    getCategoryById,
    getChildCategories,
    getParentCategories
  }
})