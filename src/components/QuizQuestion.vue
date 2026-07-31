<template>
  <div class="question-card" :class="{ 'dark-card': dark }"
    :style="submitted
      ? (isCorrect ? `border-color: ${dark ? 'rgba(18,166,122,0.4)' : '#9FD9C6'}` : `border-color: ${dark ? 'rgba(232,69,60,0.4)' : '#F5B8B5'}`)
      : ''">

    <!-- Question -->
    <div class="flex items-start gap-3 mb-4">
      <span class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        :style="`background: ${color}22; color: ${color}; border: 1px solid ${color}44`">
        {{ index + 1 }}
      </span>
      <p class="text-sm leading-relaxed" :class="dark ? 'text-game' : 'text-light'">{{ question.question }}</p>
    </div>

    <!-- Options -->
    <div class="space-y-2 ml-9">
      <button
        v-for="(opt, i) in question.options" :key="i"
        class="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 border"
        :class="{ 'cursor-not-allowed': submitted }"
        :style="getOptionStyle(i)"
        @click="!submitted && $emit('select', i)"
      >
        <div class="flex items-center gap-2.5">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-medium border"
            :style="getCircleStyle(i)">
            <template v-if="submitted && i === question.correct">
              <IconCheck size="11" stroke="3" />
            </template>
            <template v-else-if="submitted && i === selected">
              <IconX size="11" stroke="3" />
            </template>
            <template v-else>
              {{ String.fromCharCode(65 + i) }}
            </template>
          </span>
          <span>{{ opt }}</span>
        </div>
      </button>

      <!-- Explanation -->
      <Transition name="explanation">
        <div v-if="submitted" class="mt-3 px-4 py-3 rounded-xl text-xs leading-relaxed"
          :style="isCorrect
            ? (dark ? 'background: rgba(18,166,122,0.12); border: 1px solid rgba(18,166,122,0.3); color: #4ECDA4' : 'background: #E6F6F1; border: 1px solid #9FD9C6; color: #0A8A68')
            : (dark ? 'background: rgba(232,69,60,0.1); border: 1px solid rgba(232,69,60,0.3); color: #FF8080' : 'background: #FDECEA; border: 1px solid #F5B8B5; color: #B53028')">
          <span class="font-semibold flex items-center gap-1 mb-1">
            <IconCheck v-if="isCorrect" size="12" stroke="3" />
            <IconX v-else size="12" stroke="3" />
            {{ isCorrect ? 'Correct!' : 'Incorrect.' }}
          </span>
          {{ question.explanation }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconCheck, IconX } from '@/icons'

const props = defineProps<{
  question: { question: string; options: string[]; correct: number; explanation: string }
  index: number
  color: string
  selected: number | null
  submitted: boolean
  dark?: boolean
}>()

defineEmits<{ select: [number] }>()

const isCorrect = computed(() => props.submitted && props.selected === props.question.correct)

function getOptionStyle(i: number) {
  const d = props.dark

  if (!props.submitted) {
    if (props.selected === i) {
      return `background: ${props.color}22; border-color: ${props.color}66; color: ${d ? 'rgba(232,232,255,0.9)' : 'var(--color-text-primary)'}`
    }
    return d
      ? 'background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: rgba(232,232,255,0.55)'
      : 'background: var(--color-bg-elevated); border-color: var(--color-border-dim); color: var(--color-text-secondary)'
  }

  // Post-submit
  if (i === props.question.correct) {
    return d
      ? 'background: rgba(18,166,122,0.12); border-color: rgba(18,166,122,0.4); color: #4ECDA4'
      : 'background: #E6F6F1; border-color: #9FD9C6; color: #0A8A68'
  }
  if (i === props.selected && props.selected !== props.question.correct) {
    return d
      ? 'background: rgba(232,69,60,0.1); border-color: rgba(232,69,60,0.35); color: #FF8080'
      : 'background: #FDECEA; border-color: #F5B8B5; color: #B53028'
  }
  return d
    ? 'background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.06); color: rgba(232,232,255,0.25)'
    : 'background: var(--color-bg-elevated); border-color: var(--color-border-dim); color: var(--color-text-muted); opacity: 0.5'
}

function getCircleStyle(i: number) {
  const d = props.dark

  if (!props.submitted) {
    return props.selected === i
      ? `background: ${props.color}33; border-color: ${props.color}; color: ${props.color}`
      : (d
          ? 'background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); color: rgba(232,232,255,0.3)'
          : 'background: var(--color-bg-base); border-color: var(--color-border-dim); color: var(--color-text-muted)')
  }
  if (i === props.question.correct) {
    return d
      ? 'background: rgba(18,166,122,0.2); border-color: #12A67A; color: #12A67A'
      : 'background: #E6F6F1; border-color: #0A8A68; color: #0A8A68'
  }
  if (i === props.selected) {
    return d
      ? 'background: rgba(232,69,60,0.15); border-color: #E8453C; color: #E8453C'
      : 'background: #FDECEA; border-color: #E8453C; color: #E8453C'
  }
  return d
    ? 'background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); color: rgba(232,232,255,0.2)'
    : 'background: var(--color-bg-base); border-color: var(--color-border-dim); color: var(--color-text-muted)'
}
</script>

<style scoped>
.question-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.2s;
}
.dark-card {
  background: rgba(255,255,255,0.04) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
.text-game  { color: rgba(232,232,255,0.85); }
.text-light { color: var(--color-text-primary); }

.explanation-enter-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.explanation-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
