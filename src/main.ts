import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import router from './router'
import { i18n } from './i18n'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(MotionPlugin)

// Load saved game state before mounting
import { useGameStore } from './stores/game'
const game = useGameStore()
game.load()

app.mount('#app')
