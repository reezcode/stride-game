<template>
  <RouterLink
    v-if="unlocked"
    :to="route"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
    :class="[
      isCurrent
        ? 'text-white'
        : 'hover:bg-[#F4F4F0]'
    ]"
    :style="isCurrent
      ? `background: ${phaseColor(step.phase)}; color: white;`
      : 'color: #4A4A46;'"
  >
    <component :is="step.icon" size="13" stroke="2" />
    <span class="hidden lg:inline">{{ step.label }}</span>
    <IconCheck size="11" stroke="3" v-if="isCompleted && !isCurrent" style="color: #12A67A;" />
  </RouterLink>
  <div v-else
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed opacity-35"
    style="color: #8A8A84;"
  >
    <IconLocked size="13" stroke="2" />
    <span class="hidden lg:inline">{{ step.label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { IconCheck, IconLocked } from '@/icons'

const props = defineProps<{
  step: { phase: number; label: string; icon: any }
  current: number
  unlocked: boolean
}>()

const isCurrent  = computed(() => props.current === props.step.phase)
const isCompleted = computed(() => props.current > props.step.phase)

const routeMap: Record<number, string> = {
  1: '/phase/1',
  2: '/phase/2',
  3: '/phase/3',
  4: '/results',
}
const route = computed(() => routeMap[props.step.phase] ?? '/')

function phaseColor(phase: number) {
  const colors: Record<number, string> = {
    1: '#E8453C',
    2: '#4339CA',
    3: '#12A67A',
    4: '#E8960A',
  }
  return colors[phase] ?? '#0C0C0A'
}
</script>
