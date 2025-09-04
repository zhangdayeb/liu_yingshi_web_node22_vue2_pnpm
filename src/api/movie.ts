import request from './request'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export const movieApi = {
  // 获取分类列表
  getTypeList() {
    return request({
      url: `${API_BASE}/movie/type_list`,
      method: 'GET'
    })
  },
  
  // 获取影片列表
  getList(params: any) {
    return request({
      url: `${API_BASE}/movie/list`,
      method: 'GET',
      params
    })
  },
  
  // 获取影片详情
  getInfo(id: number) {
    return request({
      url: `${API_BASE}/movie/info`,
      method: 'GET',
      params: { id }
    })
  },
  
  // 记录播放日志
  addPlayLog(content_id: number) {
    return request({
      url: `${API_BASE}/movie/play_log`,
      method: 'POST',
      data: { content_id }
    })
  }
}