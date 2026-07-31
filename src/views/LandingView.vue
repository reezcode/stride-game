<template>
  <div class="min-h-screen flex flex-col">

    <!-- ─── Hero Section ─── -->
    <div class="flex-1 grid md:grid-cols-2 min-h-screen">

      <!-- Left: Content -->
      <div class="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-24 md:py-16 bg-white">

        <!-- Eyebrow badge -->
        <div class="inline-flex items-center gap-2 mb-8">
          <span class="inline-block w-2 h-2 rounded-full" style="background: #E8453C;"></span>
          <span class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: #8A8A84;">
            Application Security Training
          </span>
        </div>

        <!-- Headline -->
        <h1 class="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tight mb-6"
          style="color: #0C0C0A;">
          Learn<br />
          Threat<br />
          <span style="color: #4339CA;">Modeling</span>
        </h1>

        <p class="text-base md:text-lg leading-relaxed mb-10 max-w-sm" style="color: #4A4A46;">
          A hands-on security review simulation using the
          <strong style="color: #0C0C0A;">STRIDE framework</strong> —
          identify vulnerabilities in a real-world fintech app.
        </p>

        <!-- STRIDE pill tags -->
        <div class="flex flex-wrap gap-2 mb-10">
          <span v-for="item in strideTiles" :key="item.letter"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border"
            :style="`background: ${item.bg}; border-color: ${item.border}; color: ${item.color};`">
            <span class="font-black font-mono">{{ item.letter }}</span>
            <span class="font-medium opacity-80">{{ item.name }}</span>
          </span>
        </div>

        <!-- CTA -->
        <div v-if="!showForm" class="flex items-center gap-4">
          <button class="btn-primary text-sm px-8 py-3.5" @click="showForm = true">
            Get Started →
          </button>
          <span class="text-xs" style="color: #8A8A84;">No account required</span>
        </div>

        <!-- Name form -->
        <Transition name="slide-up">
          <div v-if="showForm" class="card p-5 space-y-3 max-w-sm">
            <h3 class="text-sm font-semibold" style="color: #0C0C0A;">Enter your name to begin</h3>
            <input
              v-model="name"
              class="input-field"
              placeholder="Your name..."
              maxlength="50"
              autofocus
              @keydown.enter="startSession"
            />
            <p class="text-xs" style="color: #8A8A84;">
              Used only to label your session. No account created.
            </p>
            <div class="flex gap-2 pt-1">
              <button class="btn-ghost text-xs py-2 px-4 justify-center" @click="showForm = false">Back</button>
              <button
                class="btn-primary text-xs py-2 px-5 flex-1 justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
                :disabled="!name.trim()"
                @click="startSession"
              >
                Start Review →
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Right: Flat color block with decorative STRIDE letters -->
      <div class="hidden md:flex flex-col relative overflow-hidden" style="background: #0C0C0A;">

        <!-- Large decorative STRIDE background text -->
        <div class="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none overflow-hidden">
          <div v-for="(letter, i) in strideLetters" :key="letter"
            class="text-[140px] font-black leading-none"
            :style="`color: ${strideColors[i]}; opacity: 0.15; line-height: 0.85;`">
            {{ letter }}
          </div>
        </div>

        <!-- Floating color blocks — flat geometric -->
        <div class="absolute top-12 right-12 w-20 h-20 rounded-2xl" style="background: #E8453C;"></div>
        <div class="absolute top-36 right-4 w-10 h-10 rounded-xl" style="background: #E8960A;"></div>
        <div class="absolute bottom-20 left-12 w-16 h-16 rounded-2xl" style="background: #12A67A;"></div>
        <div class="absolute bottom-12 left-4 w-8 h-8 rounded-lg" style="background: #4339CA;"></div>
        <div class="absolute top-1/2 right-8 w-12 h-12 rounded-xl" style="background: #7B41E0;"></div>

        <!-- How it works — flat cards overlay -->
        <div class="relative z-10 mt-auto p-10 space-y-3">
          <p class="text-xs font-bold uppercase tracking-[0.14em] mb-5" style="color: #8A8A84;">How it works</p>
          <div v-for="(step, i) in howItWorks" :key="i"
            class="flex items-center gap-3 p-3 rounded-lg"
            style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);">
            <div class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0 text-white"
              :style="`background: ${step.color};`">
              {{ i + 1 }}
            </div>
            <div>
              <div class="text-xs font-semibold" style="color: #FAFAF8;">{{ step.title }}</div>
              <div class="text-xs mt-0.5 leading-relaxed" style="color: rgba(250,250,248,0.5);">{{ step.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Mobile: How it works ─── -->
    <div class="md:hidden px-8 py-10 border-t" style="border-color: #D8D8D0; background: #F4F4F0;">
      <p class="text-xs font-bold uppercase tracking-[0.14em] mb-4" style="color: #8A8A84;">How it works</p>
      <div class="space-y-3">
        <div v-for="(step, i) in howItWorks" :key="i" class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 text-white"
            :style="`background: ${step.color};`">
            {{ i + 1 }}
          </div>
          <div>
            <div class="text-sm font-semibold" style="color: #0C0C0A;">{{ step.title }}</div>
            <div class="text-xs mt-0.5" style="color: #8A8A84;">{{ step.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress'

const router = useRouter()
const store  = useProgressStore()

const showForm = ref(false)
const name    = ref('')

if (store.sessionStarted) {
  if      (store.phase3Submitted)  router.replace('/results')
  else if (store.phase2Completed)  router.replace('/phase/3')
  else if (store.phase1Submitted)  router.replace('/phase/2')
  else                             router.replace('/phase/1')
}

const strideLetters = ['S', 'T', 'R', 'I', 'D', 'E']
const strideColors  = ['#E8453C', '#E8960A', '#12A67A', '#2276D2', '#52A882', '#7B41E0']

const strideTiles = [
  { letter: 'S', name: 'Spoofing',        color: '#B53028', bg: '#FDECEA', border: '#F5B8B5' },
  { letter: 'T', name: 'Tampering',       color: '#925C00', bg: '#FEF3E0', border: '#F9D49A' },
  { letter: 'R', name: 'Repudiation',     color: '#0A7A59', bg: '#E6F6F1', border: '#9FD9C6' },
  { letter: 'I', name: 'Info Disclosure', color: '#155FA0', bg: '#E8F1FC', border: '#9DC3ED' },
  { letter: 'D', name: 'Denial of Svc',  color: '#2E6B4A', bg: '#ECF5EE', border: '#A5CDB5' },
  { letter: 'E', name: 'Elevation',       color: '#5B28B8', bg: '#F1ECFE', border: '#C5ADEE' },
]

const howItWorks = [
  { title: 'Blind Review',     desc: 'Analyze 5 fintech app scenarios with no framework',          color: '#E8453C' },
  { title: 'STRIDE Learning',  desc: 'Study 6 threat categories with interactive quizzes',          color: '#4339CA' },
  { title: 'Guided Review',    desc: 'Re-analyze the same scenarios using STRIDE',                  color: '#12A67A' },
  { title: 'Analysis & Score', desc: 'Compare blind vs framework results and identify your gaps',   color: '#E8960A' },
]

function startSession() {
  if (!name.value.trim()) return
  store.startSession(name.value.trim())
  router.push('/phase/1')
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
.slide-up-leave-to  { opacity: 0; transform: translateY(-8px); }
</style>
