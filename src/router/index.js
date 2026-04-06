import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from '../pages/SearchPage.vue'
import StatusPage from '../pages/StatusPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'search', component: SearchPage },
    { path: '/status', name: 'status', component: StatusPage },
  ],
})

export default router