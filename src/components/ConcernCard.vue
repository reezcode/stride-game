<template>
  <div class="concern-card" :style="`border-color: ${catData.color}33;`">
    <!-- Category header -->
    <div class="concern-header" :style="`background: ${catData.color}12;`">
      <div class="cat-badge" :style="`background: ${catData.color}22; border-color: ${catData.color}55; color: ${catData.color};`">
        <span class="cat-letter">{{ category }}</span>
      </div>
      <div>
        <div class="cat-name" :style="`color: ${catData.color};`">{{ catData.name }}</div>
        <div class="cat-tagline">{{ catData.tagline }}</div>
      </div>
    </div>

    <!-- Form fields -->
    <div class="concern-body">
      <!-- Threat title -->
      <div class="field-group">
        <label class="field-label">Threat Title <span class="required">*</span></label>
        <input
          v-model="localTitle"
          class="game-input text-sm"
          :placeholder="`e.g. Brute Force on ${catData.name}`"
          maxlength="80"
          @input="emitUpdate"
        />
      </div>

      <!-- Severity -->
      <div class="field-group">
        <label class="field-label">Severity</label>
        <div class="severity-row">
          <button
            v-for="sev in severities" :key="sev.id"
            class="sev-btn"
            :class="{ active: localSeverity === sev.id }"
            :style="localSeverity === sev.id
              ? `background: ${sev.color}22; border-color: ${sev.color}66; color: ${sev.color};`
              : ''"
            @click="setSeverity(sev.id)"
          >{{ sev.id }}</button>
        </div>
      </div>

      <!-- Explanation -->
      <div class="field-group">
        <label class="field-label">Explanation <span class="optional">(optional)</span></label>
        <textarea
          v-model="localExplanation"
          class="game-textarea text-sm"
          :placeholder="`Describe how this ${catData.name} threat manifests in this system...`"
          rows="3"
          maxlength="500"
          @input="emitUpdate"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FiledConcern } from '@/stores/game'

type Sev = 'Critical' | 'High' | 'Medium' | 'Low'

const props = defineProps<{
  category: string
  concern: Omit<FiledConcern, 'id' | 'category'>
}>()
const emit = defineEmits<{
  update: [data: Omit<FiledConcern, 'id' | 'category'>]
}>()

const catMap: Record<string, { name: string; tagline: string; color: string }> = {
  S: { name: 'Spoofing',              tagline: 'Identity & Access Fraud',      color: '#E8453C' },
  T: { name: 'Tampering',             tagline: 'Data & System Manipulation',   color: '#E8960A' },
  R: { name: 'Repudiation',           tagline: 'Activity Without Trace',       color: '#12A67A' },
  I: { name: 'Information Disclosure', tagline: 'Sensitive Data Leak',         color: '#2276D2' },
  D: { name: 'Denial of Service',     tagline: 'System Unavailability',        color: '#52A882' },
  E: { name: 'Elevation of Privilege', tagline: 'Unauthorized Privilege Gain', color: '#7B41E0' },
}
const catData = catMap[props.category] ?? catMap['S']

const severities = [
  { id: 'Critical' as Sev, color: '#E8453C' },
  { id: 'High'     as Sev, color: '#E8960A' },
  { id: 'Medium'   as Sev, color: '#2276D2' },
  { id: 'Low'      as Sev, color: '#12A67A' },
]

const localTitle       = ref(props.concern.title)
const localSeverity    = ref<Sev>(props.concern.severity)
const localExplanation = ref(props.concern.explanation)

watch(() => props.concern, c => {
  localTitle.value       = c.title
  localSeverity.value    = c.severity
  localExplanation.value = c.explanation
}, { deep: true })

function setSeverity(s: Sev) {
  localSeverity.value = s
  emitUpdate()
}

function emitUpdate() {
  emit('update', {
    title: localTitle.value,
    severity: localSeverity.value,
    explanation: localExplanation.value,
  })
}
</script>

<style scoped>
.concern-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.02);
}

.concern-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.cat-badge {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cat-letter {
  font-size: 18px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}
.cat-name {
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 2px;
}
.cat-tagline {
  font-size: 10px;
  color: rgba(232,232,255,0.35);
  font-weight: 500;
}

.concern-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(232,232,255,0.35);
}
.required { color: #E8453C; }
.optional { color: rgba(232,232,255,0.25); text-transform: none; letter-spacing: 0; }

.severity-row { display: flex; gap: 6px; }
.sev-btn {
  flex: 1;
  padding: 6px 4px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(232,232,255,0.35);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.sev-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(232,232,255,0.7); }
.sev-btn.active { font-weight: 800; }
</style>
