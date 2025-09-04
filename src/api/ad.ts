import request from './request'

const AD_API = import.meta.env.VITE_AD_API_URL

export const adApi = {
  // 获取广告
  getAds(position: string) {
    return request({
      url: `${AD_API}/ads`,
      method: 'GET',
      params: { position }
    })
  }
}