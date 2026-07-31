<template>
  <nav class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full border shadow-sm backdrop-blur-md transition-all duration-300"
    style="background: rgba(255, 255, 255, 0.85); border-color: rgba(0,0,0,0.05);">
    <div class="px-5 py-2.5 flex items-center justify-between">

      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style="background: #0C0C0A;">
          <IconShieldLock size="16" stroke="2.5" />
        </div>
        <span class="font-bold text-sm tracking-tight" style="color: #0C0C0A;">STRIDE</span>
      </RouterLink>

      <!-- Phase Menus (Center) -->
      <div class="hidden md:flex items-center gap-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <template v-for="step in steps" :key="step.phase">
          <RouterLink
            v-if="isUnlocked(step.phase)"
            :to="getPhaseRoute(step.phase)"
            class="text-[13px] font-medium transition-colors"
            :class="store.currentPhase === step.phase ? 'text-black font-semibold' : 'text-gray-400 hover:text-gray-900'"
          >
            {{ step.label }}
          </RouterLink>
          <span v-else class="text-[13px] font-medium text-gray-300 cursor-not-allowed">
            {{ step.label }}
          </span>
        </template>
      </div>

      <!-- User badge + reset -->
      <div class="flex items-center gap-3">
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border"
          style="border-color: rgba(0,0,0,0.08); background: white; color: #4A4A46;">
          <div class="w-1.5 h-1.5 rounded-full" style="background: #12A67A;"></div>
          <span>{{ store.userName }}</span>
        </div>
        <button
          @click="resetConfirm = true"
          class="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/5 text-[#8A8A84] hover:text-[#0C0C0A]"
          title="Reset session"
        >
          <IconRefresh size="15" />
        </button>
      </div>
    </div>
  </nav>

  <!-- Reset confirm modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="resetConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(12,12,10,0.5);">
        <div class="card p-6 max-w-sm w-full space-y-4 shadow-lg">
          <h3 class="font-bold text-base" style="color: #0C0C0A;">Reset Session?</h3>
          <p class="text-sm" style="color: #4A4A46;">
            All progress and answers will be permanently deleted. This action cannot be undone.
          </p>
          <div class="flex gap-3 pt-1">
            <button class="btn-ghost flex-1 text-sm py-2.5 justify-center" @click="resetConfirm = false">Cancel</button>
            <button
              class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border justify-center flex items-center"
              style="background: #E8453C; border-color: #E8453C; color: white;"
              @click="doReset">
              Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { IconShieldLock, IconRefresh } from '@tabler/icons-vue'

const store = useProgressStore()
const router = useRouter()
const resetConfirm = ref(false)

const steps = [
  { phase: 1, label: 'Blind Review' },
  { phase: 2, label: 'STRIDE Learning' },
  { phase: 3, label: 'Guided Review' },
  { phase: 4, label: 'Results' },
]

function isUnlocked(phase: number) {
  if (phase === 1) return store.sessionStarted
  if (phase === 2) return store.canAccessPhase2
  if (phase === 3) return store.canAccessPhase3
  if (phase === 4) return store.canAccessResults
  return false
}

function getPhaseRoute(phase: number) {
  if (phase === 1) return '/phase/1'
  if (phase === 2) return '/phase/2'
  if (phase === 3) return '/phase/3'
  if (phase === 4) return '/results'
  return '/'
}

function doReset() {
  store.resetSession()
  resetConfirm.value = false
  router.push('/')
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
