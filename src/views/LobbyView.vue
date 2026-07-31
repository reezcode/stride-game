<template>
  <div class="lobby-bg min-h-screen flex items-center justify-center relative overflow-hidden">

    <!-- Scanline overlay -->
    <div class="scanline-layer pointer-events-none" aria-hidden="true"></div>

    <!-- Ambient particles -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div v-for="p in particles" :key="p.id"
        class="particle"
        :style="`left:${p.x}%; top:${p.y}%; width:${p.size}px; height:${p.size}px; background:${p.color}; animation-duration:${p.dur}s; animation-delay:${p.delay}s;`">
      </div>
    </div>

    <!-- Large STRIDE letters in background -->
    <div class="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none overflow-hidden" aria-hidden="true">
      <div v-for="(letter, i) in ['S','T','R','I','D','E']" :key="letter"
        class="text-[160px] font-black leading-[0.8] tracking-tighter opacity-[0.03]"
        :style="`color: ${strideColors[i]};`">
        {{ letter }}
      </div>
    </div>

    <!-- Main card -->
    <div class="relative z-10 w-full max-w-md mx-4 animate-fade-up">
      <div class="game-card p-8">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style="background: rgba(232,69,60,0.15); border: 1px solid rgba(232,69,60,0.3);">
            <span class="w-2 h-2 rounded-full bg-[#E8453C] animate-glow-pulse" style="box-shadow: 0 0 6px #E8453C;"></span>
            <span class="text-xs font-bold uppercase tracking-widest text-[#E8453C]">Security Alert</span>
          </div>
          <h1 class="text-4xl font-black tracking-tight mb-2" style="color: var(--game-text);">
            STRIDE<br/>
            <span style="color: var(--game-text-dim); font-size: 1.6rem; font-weight: 700;">Security Detective</span>
          </h1>
          <p class="text-sm leading-relaxed" style="color: var(--game-text-muted);">
            The <strong style="color: var(--game-text);">PayVault HQ</strong> has been breached. 5 terminals are
            compromised. Identify the threats and file your security reports.
          </p>
        </div>

        <!-- Step 1: Name -->
        <div v-if="step === 'name'" class="space-y-5 animate-fade-in">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color: var(--game-text-dim);">
              Detective Codename
            </label>
            <input
              id="detective-name"
              v-model="name"
              class="game-input"
              placeholder="Enter your codename..."
              maxlength="30"
              autofocus
              @keydown.enter="name.trim() && (step = 'color')"
            />
          </div>
          <button
            class="btn-game-accent w-full py-3.5 justify-center"
            style="background: #E8453C22; border-color: #E8453C66; color: #fff;"
            :disabled="!name.trim()"
            :style="name.trim() ? '' : 'opacity:0.4; cursor:not-allowed;'"
            @click="name.trim() && (step = 'color')"
          >
            Choose Your Color →
          </button>
        </div>

        <!-- Step 2: Color -->
        <div v-else-if="step === 'color'" class="space-y-5 animate-fade-in">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-3" style="color: var(--game-text-dim);">
              Pick Your Detective Color
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="c in PLAYER_COLORS" :key="c.id"
                class="color-chip"
                :class="{ selected: selectedColor === c.hex }"
                :style="`--chip-color: ${c.hex}`"
                :id="`color-${c.id}`"
                @click="selectedColor = c.hex"
              >
                <!-- Among Us style mini character -->
                <div class="mini-char" :style="`background: ${c.hex};`">
                  <div class="mini-visor"></div>
                </div>
                <span class="text-xs font-semibold mt-1" style="color: var(--game-text-dim);">{{ c.label }}</span>
              </button>
            </div>
          </div>
          <div class="flex gap-3">
            <button class="btn-game flex-1 py-3 justify-center text-sm" @click="step = 'name'">← Back</button>
            <button
              class="btn-game-accent flex-1 py-3 justify-center"
              style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #fff;"
              @click="startGame"
            >
              Start Mission →
            </button>
          </div>
        </div>

        <!-- STRIDE reference strip -->
        <div class="flex justify-center gap-1.5 mt-8 pt-6 border-t" style="border-color: rgba(255,255,255,0.07);">
          <div v-for="(item, i) in strideTiles" :key="item.letter"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-transform hover:scale-110"
            :style="`background: ${item.color}22; border: 1px solid ${item.color}44; color: ${item.color};`"
            :title="item.name">
            {{ item.letter }}
          </div>
        </div>
      </div>

      <!-- Already started badge -->
      <div v-if="store.gameStarted && !isNewGame"
        class="mt-3 text-center">
        <button class="text-xs underline" style="color: var(--game-text-muted);" @click="resumeGame">
          Resume as {{ store.playerName }} →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, PLAYER_COLORS } from '@/stores/game'

const router = useRouter()
const store  = useGameStore()
store.load()

const step         = ref<'name'|'color'>('name')
const name         = ref('')
const selectedColor = ref(PLAYER_COLORS[0].hex)
const isNewGame    = ref(false)

// Pre-fill if resuming
if (store.gameStarted) {
  name.value         = store.playerName
  selectedColor.value = store.playerColor
}

const strideColors = ['#E8453C', '#E8960A', '#12A67A', '#2276D2', '#52A882', '#7B41E0']
const strideTiles  = [
  { letter: 'S', name: 'Spoofing',              color: '#E8453C' },
  { letter: 'T', name: 'Tampering',             color: '#E8960A' },
  { letter: 'R', name: 'Repudiation',           color: '#12A67A' },
  { letter: 'I', name: 'Information Disclosure', color: '#2276D2' },
  { letter: 'D', name: 'Denial of Service',     color: '#52A882' },
  { letter: 'E', name: 'Elevation of Privilege', color: '#7B41E0' },
]

// Random ambient particles
const particles = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  color: strideColors[Math.floor(Math.random() * strideColors.length)],
  dur: Math.random() * 6 + 4,
  delay: Math.random() * 4,
}))

function startGame() {
  store.startGame(name.value.trim() || 'Detective', selectedColor.value)
  isNewGame.value = true
  router.push('/game')
}

function resumeGame() {
  router.push(store.allSolved ? '/debrief' : '/game')
}
</script>

<style scoped>
.lobby-bg {
  background: var(--game-bg);
  background-image:
    radial-gradient(ellipse 60% 60% at 20% 30%, rgba(232,69,60,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 80% 70%, rgba(114,65,224,0.08) 0%, transparent 70%);
}

.scanline-layer {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.12) 2px,
    rgba(0,0,0,0.12) 4px
  );
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
  animation: floatParticle linear infinite;
}
@keyframes floatParticle {
  0%   { transform: translateY(0) scale(1); opacity: 0.3; }
  50%  { opacity: 0.7; transform: translateY(-30px) scale(1.2); }
  100% { transform: translateY(0) scale(1); opacity: 0.3; }
}

/* Color chip */
.color-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  transition: all 0.18s ease;
}
.color-chip:hover {
  background: rgba(255,255,255,0.08);
  border-color: var(--chip-color);
  transform: translateY(-2px);
}
.color-chip.selected {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 15%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--chip-color) 40%, transparent);
}

/* Mini Among-Us character */
.mini-char {
  width: 28px;
  height: 32px;
  border-radius: 50% 50% 40% 40%;
  position: relative;
  flex-shrink: 0;
}
.mini-visor {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  height: 10px;
  background: rgba(255,255,255,0.9);
  border-radius: 50% 50% 30% 30%;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.25);
}
</style>
