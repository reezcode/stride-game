<template>
  <RouterLink :to="locked ? '' : `/phase/2/${letter}`"
    :class="['block card p-5 transition-all duration-200 relative overflow-hidden', locked ? 'cursor-not-allowed opacity-40' : 'hover:-translate-y-0.5 cursor-pointer']"
    :style="!locked ? `border-color: ${completed ? data.color : 'var(--color-border)'}` : ''"
    @click.prevent="navigate"
  >
    <!-- Completed flat top strip -->
    <div v-if="completed" class="absolute top-0 left-0 right-0 h-0.5"
      :style="`background: ${data.color};`">
    </div>

    <!-- Header Layout -->
    <div class="flex items-center gap-3 mb-3 relative z-10">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
        :style="`background: ${data.bgColor}; border: 1px solid ${data.borderColor}; color: ${data.color}`">
        <component :is="strideIcons[data.letter]" size="20" stroke="2" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-xl font-bold font-mono" :style="`color: ${data.color}`">{{ letter }}</span>
          <h3 class="text-sm font-semibold truncate" style="color: var(--color-text-primary);">{{ data.name }}</h3>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="locked" class="flex items-center gap-1 text-[10px] font-medium" style="color: var(--color-text-muted);">
            <IconLocked size="10" stroke="2" /> Locked
          </span>
          <span v-else-if="completed" class="text-[10px] font-semibold px-2 py-0.5 rounded"
            style="background: #E6F6F1; color: #0A8A68; border: 1px solid #9FD9C6;"
            :style="`display: inline-flex; align-items: center; gap: 0.3rem;`">
            <IconCheck size="10" /> Done
          </span>
          <span v-else class="text-[10px] font-medium px-2 py-0.5 rounded"
            :style="`background: var(--color-bg-elevated); color: ${data.color}; border: 1px solid ${data.borderColor}`">
            Available
          </span>
          <!-- Score badge -->
          <span v-if="completed && score !== undefined" class="text-[10px] font-medium"
            style="color: var(--color-text-muted); display: inline-flex; align-items: center; gap: 0.3rem;">
            Quiz: {{ score }}/3 <IconCheck size="10" style="color: #12A67A;" />
          </span>
        </div>
      </div>
    </div>
    
    <p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">{{ data.tagline }}</p>

    <!-- Keywords -->
    <div class="flex flex-wrap gap-1 mt-4">
      <span v-for="kw in data.keywords.slice(0, 2)" :key="kw"
        class="text-[10px] px-2 py-0.5 rounded"
        :style="`background: var(--color-bg-elevated); color: var(--color-text-secondary); border: 1px solid var(--color-border-dim);`">
        {{ kw }}
      </span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { computed } from 'vue'
import { strideIcons, IconLocked, IconCheck } from '@/icons'

const props = defineProps<{
  letter: string
  index: number
  data: any
  locked: boolean
  completed: boolean
  score?: number
}>()

const router = useRouter()

function navigate() {
  if (!props.locked) {
    router.push(`/phase/2/${props.letter}`)
  }
}
</script>
