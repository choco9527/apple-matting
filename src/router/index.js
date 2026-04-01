import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/matting/single'
  },
  {
    path: '/matting/single',
    name: 'SingleMatting',
    component: () => import('@/views/matting/SingleMatting.vue'),
    meta: {
      requiresLicense: false
    }
  },
  {
    path: '/matting/batch',
    name: 'BatchMatting',
    component: () => import('@/views/matting/BatchMatting.vue'),
    meta: {
      requiresLicense: false
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})


export default router