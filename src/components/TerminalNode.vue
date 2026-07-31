<template>
  <div class="terminal-wrap" :class="statusClass" @click="$emit('interact')">

    <!-- Glow ring -->
    <div class="terminal-glow" :style="`background: ${glowColor}; box-shadow: 0 0 30px ${glowColor};`"></div>

    <!-- Terminal screen -->
    <div class="terminal-screen" :style="`border-color: ${glowColor}55;`">

      <!-- Screen content -->
      <div class="screen-header">
        <div class="screen-dot solved-dot" v-if="isSolved"></div>
        <div class="screen-dot alert-dot animate-glow-pulse" v-else></div>
        <span class="screen-id">{{ terminal.label }}</span>
      </div>

      <div class="screen-body">
        <div v-if="!isSolved" class="screen-lines">
          <div class="s-line red"></div>
          <div class="s-line red short"></div>
          <div class="s-line orange"></div>
          <div class="s-line red shorter"></div>
        </div>
        <div v-else class="screen-lines">
          <div class="s-line green"></div>
          <div class="s-line green short"></div>
          <div class="s-line green"></div>
        </div>
      </div>

      <!-- Status text -->
      <div class="screen-status" :style="`color: ${glowColor};`">
        {{ isSolved ? 'SECURED' : 'BREACH DETECTED' }}
        <span v-if="!isSolved" class="animate-terminal-blink">_</span>
      </div>
    </div>

    <!-- Near pulse ring -->
    <div v-if="isNear && !isSolved" class="near-ring" :style="`border-color: ${glowColor}; box-shadow: 0 0 20px ${glowColor}44;`"></div>

    <!-- Label below -->
    <div class="terminal-label" :style="`color: ${glowColor};`">{{ terminal.code }}</div>

    <!-- Interact prompt -->
    <div v-if="isNear && !isSolved" class="terminal-prompt">
      <span class="prompt-key">E</span> Investigate
    </div>

    <!-- Already solved badge -->
    <div v-if="isSolved" class="solved-badge">✓ Case Sealed</div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseProgress } from '@/stores/game'

interface Terminal {
  id: string
  scenarioId: string
  label: string
  code: string
  x: number
  y: number
}

const props = defineProps<{
  terminal: Terminal
  caseProgress: CaseProgress | undefined
  isNear: boolean
}>()

defineEmits<{ interact: [] }>()

const isSolved  = computed(() => props.caseProgress?.solved ?? false)
const isVisited = computed(() => props.caseProgress?.visited ?? false)

const glowColor = computed(() => {
  if (isSolved.value) return '#12A67A'
  if (isVisited.value) return '#E8960A'
  return '#E8453C'
})

const statusClass = computed(() => ({
  'terminal-solved':   isSolved.value,
  'terminal-visited':  !isSolved.value && isVisited.value,
  'terminal-unsolved': !isSolved.value && !isVisited.value,
  'terminal-near':     props.isNear,
}))
</script>

<style scoped>
.terminal-wrap {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
}
.terminal-wrap:hover,
.terminal-near { transform: scale(1.06); }

.terminal-glow {
  position: absolute;
  top: 8px;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  opacity: 0.08;
  filter: blur(10px);
  animation: glowPulse 2.5s ease-in-out infinite;
}

/* Screen */
.terminal-screen {
  width: 72px;
  height: 64px;
  background: #080818;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 12px rgba(0,0,0,0.6);
  transition: border-color 0.3s;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 5px 3px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.screen-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.alert-dot { background: #E8453C; box-shadow: 0 0 4px #E8453C; }
.solved-dot { background: #12A67A; }
.screen-id {
  font-size: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.screen-body { padding: 4px 5px; }
.s-line {
  height: 3px;
  border-radius: 2px;
  margin-bottom: 3px;
  width: 100%;
  opacity: 0.7;
  animation: lineFlicker 1.5s ease-in-out infinite;
}
.s-line.short { width: 70%; }
.s-line.shorter { width: 45%; }
.s-line.red    { background: rgba(232,69,60,0.7); }
.s-line.orange { background: rgba(232,150,10,0.7); }
.s-line.green  { background: rgba(18,166,122,0.7); }

@keyframes lineFlicker {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1; }
}

.screen-status {
  font-size: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  padding: 0 4px 4px;
  line-height: 1;
}

/* Near ring */
.near-ring {
  position: absolute;
  top: 4px;
  width: 80px;
  height: 72px;
  border: 2px solid;
  border-radius: 14px;
  animation: nearPulse 1s ease-in-out infinite;
  pointer-events: none;
}
@keyframes nearPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50%       { transform: scale(1.08); opacity: 0.4; }
}

.terminal-label {
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Prompts */
.terminal-prompt {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  background: rgba(8,8,24,0.85);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  padding: 3px 8px;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
.prompt-key {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 3px;
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
}

.solved-badge {
  font-size: 9px;
  font-weight: 700;
  color: #12A67A;
  background: rgba(18,166,122,0.1);
  border: 1px solid rgba(18,166,122,0.3);
  border-radius: 6px;
  padding: 2px 8px;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.08; transform: scale(1); }
  50%       { opacity: 0.18; transform: scale(1.15); }
}
</style>
