import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: () => import('@/views/LobbyView.vue'),
    },
    {
      path: '/game',
      name: 'map',
      component: () => import('@/views/MapView.vue'),
      meta: { requiresGame: true },
    },
    {
      path: '/learn',
      name: 'learning',
      component: () => import('@/views/LearningView.vue'),
      meta: { requiresGame: true },
    },
    {
      path: '/learn/:letter',
      name: 'module',
      component: () => import('@/views/ModuleView.vue'),
      meta: { requiresGame: true },
    },
    {
      path: '/debrief',
      name: 'debrief',
      component: () => import('@/views/DebriefView.vue'),
      meta: { requiresGame: true, requiresCompleted: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to, _from, next) => {
  const store = useGameStore()

  if (to.meta.requiresGame && !store.gameStarted) {
    return next('/')
  }
  if (to.meta.requiresCompleted && !store.allSolved) {
    return next('/game')
  }
  next()
})

export default router
