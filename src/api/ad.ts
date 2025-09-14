import request from './request'

// 使用广告专用的API地址
const API_BASE = import.meta.env.VITE_AD_API_URL

export const adApi = {
  // 获取广告列表
  getAdList(type_id: number) {
    return request({
      url: `${API_BASE}/ad/ad_list`,
      method: 'POST',  // 使用 POST 方法避免路由匹配问题
      data: { type_id }  // 使用 data 传递参数
    })
  }
}