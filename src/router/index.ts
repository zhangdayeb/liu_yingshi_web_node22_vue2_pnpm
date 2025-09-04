import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/Default.vue'),
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/Home.vue')
        },
        {
          path: 'category',
          name: 'Category',
          component: () => import('@/views/Category.vue')
        },
        {
          path: 'detail/:id',
          name: 'Detail',
          component: () => import('@/views/Detail.vue')
        }
      ]
    },
    {
      path: '/player/:id',
      name: 'Player',
      component: () => import('@/views/Player.vue')
    }
  ]
})

export default router