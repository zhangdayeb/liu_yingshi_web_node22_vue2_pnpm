import axios from 'axios'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { ElMessage } from 'element-plus'
import { useDeviceStore } from '@/store/device'

const request = axios.create({
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    
    if (res.code === 200) {
      return res
    } else {
      const deviceStore = useDeviceStore()
      const errorMsg = res.message || '请求失败'
      
      if (deviceStore.isMobile) {
        showToast(errorMsg)
      } else {
        ElMessage.error(errorMsg)
      }
      
      return Promise.reject(new Error(errorMsg))
    }
  },
  error => {
    const deviceStore = useDeviceStore()
    const errorMsg = error.message || '网络错误'
    
    if (deviceStore.isMobile) {
      showToast(errorMsg)
    } else {
      ElMessage.error(errorMsg)
    }
    
    return Promise.reject(error)
  }
)

export default request