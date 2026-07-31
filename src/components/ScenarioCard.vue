<template>
  <div class="card overflow-hidden" :class="{ 'ring-1': isExpanded }"
    :style="isExpanded ? 'ring-color: rgba(255,107,157,0.3)' : ''">
    <!-- Scenario Header -->
    <button
      class="w-full flex items-center gap-4 px-6 py-4 text-left transition-all hover:bg-black/[0.02]"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex-1 min-w-0 flex flex-col gap-1.5">
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider" 
                style="background: var(--color-bg-elevated); color: var(--color-text-muted); border: 1px solid var(--color-border-dim);">
            {{ scenario.code }}
          </span>
          <h3 class="font-semibold text-sm" style="color: var(--color-text-primary);">{{ scenario.title }}</h3>
        </div>
        <p class="text-xs truncate w-full" style="color: var(--color-text-secondary);">{{ scenario.description }}</p>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <span v-if="isAnswered" class="text-[11px] font-semibold px-2 py-1 rounded-md"
          style="background: #E6F6F1; color: #0A8A68; border: 1px solid #9FD9C6;"
          :style="`display: inline-flex; align-items: center; gap: 0.3rem;`">
          <IconCheck size="11" /> Done
        </span>
        <span v-else class="text-[11px] font-medium px-2 py-1 rounded-md"
          style="background: #FEF3E0; border: 1px solid #F9D49A; color: #925C00;">
          Pending
        </span>
        <span class="transition-transform duration-200 text-gray-400" :class="{ 'rotate-180': isExpanded }">▼</span>
      </div>
    </button>

    <!-- Expanded Content -->
    <Transition name="expand">
      <div v-if="isExpanded" class="border-t" style="border-color: var(--color-border);">
        <!-- Context -->
        <div class="p-6 space-y-6">
          <div>
            <h3 class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--color-text-muted);">Context</h3>
            <p class="text-xs leading-relaxed whitespace-pre-line" style="color: var(--color-text-secondary);">{{ scenario.context }}</p>
          </div>

          <!-- Key Details -->
          <div>
            <h3 class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--color-text-muted);">Key Information</h3>
            <ul class="space-y-1.5">
              <li v-for="detail in scenario.details" :key="detail"
                class="flex items-start gap-2 text-sm" style="color: var(--color-text-secondary);">
                <span style="color: var(--color-accent); margin-top: 1px;">›</span>
                {{ detail }}
              </li>
            </ul>
          </div>

          <!-- System Info / Code snippets -->
          <div v-if="scenario.systemInfo.length > 0">
            <h3 class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--color-text-muted);">Technical Details</h3>
            <div class="space-y-3">
              <div v-for="(info, i) in scenario.systemInfo" :key="i"
                class="rounded-xl overflow-hidden"
                style="background: var(--color-bg-base); border: 1px solid var(--color-border-dim);">
                <div v-if="info.endpoint" class="flex items-center gap-2 px-4 py-2.5 border-b"
                  style="border-color: var(--color-border-dim);">
                  <span class="text-xs font-bold px-2 py-0.5 rounded"
                    style="background: #F1ECFE; color: #5B28B8;">
                    {{ info.method }}
                  </span>
                  <code class="text-xs font-mono" style="color: #0A8A68;">{{ info.endpoint }}</code>
                </div>
                <div v-if="info.request" class="p-4 border-b" style="border-color: var(--color-border-dim);">
                  <div class="text-xs font-semibold mb-2" style="color: var(--color-text-muted);">Request</div>
                  <pre class="text-xs font-mono leading-relaxed overflow-x-auto" style="color: #2E7A56;">{{ info.request }}</pre>
                </div>
                <div v-if="info.response" class="p-4 border-b" style="border-color: var(--color-border-dim);">
                  <div class="text-xs font-semibold mb-2" style="color: var(--color-text-muted);">Response</div>
                  <pre class="text-xs font-mono leading-relaxed overflow-x-auto" style="color: var(--color-text-secondary);">{{ info.response }}</pre>
                </div>
                <div v-if="info.note" class="px-4 py-2.5 flex items-start gap-2">
                <IconAlertTriangle size="12" style="color: #D47A00; margin-top: 1px; flex-shrink: 0;" />
                  <span class="text-xs italic" style="color: #D47A00;">{{ info.note }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Answer Mode Toggle (Phase 1 only) -->
          <div v-if="phase === 1" class="pt-2">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--color-text-muted);">Findings Report</h3>
              <div class="flex rounded-lg overflow-hidden border" style="border-color: var(--color-border-dim);">
                <button
                  class="px-3 py-1.5 text-xs transition-all"
                  :class="localAnswer.answerMode === 'freetext'
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700'"
                  :style="localAnswer.answerMode === 'freetext' ? 'background: #0C0C0A;' : ''"
                  @click="setMode('freetext')"
                >Free Text</button>
                <button
                  class="px-3 py-1.5 text-xs transition-all"
                  :class="localAnswer.answerMode === 'table'
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700'"
                  :style="localAnswer.answerMode === 'table' ? 'background: #0C0C0A;' : ''"
                  @click="setMode('table')"
                >Table</button>
              </div>
            </div>

            <!-- Free text mode -->
            <div v-if="localAnswer.answerMode === 'freetext'">
              <textarea
                v-model="localAnswer.freeText"
                class="textarea-field text-sm"
                rows="6"
                placeholder="Deskripsikan ancaman keamanan yang kamu temukan...
Contoh: Endpoint ini mengekspos data user tanpa validasi kepemilikan. Attacker bisa mengubah ID di URL untuk melihat data user lain."
                @input="emitUpdate"
              />
              <div class="flex justify-between mt-1.5">
                <p class="text-xs" style="color: var(--color-text-muted);">Minimal 10 karakter</p>
                <span class="text-xs" :style="{ color: (localAnswer.freeText?.length ?? 0) > 10 ? '#12A67A' : 'var(--color-text-muted)' }">
                  {{ localAnswer.freeText?.length ?? 0 }} karakter
                </span>
              </div>
            </div>

            <!-- Table mode -->
            <div v-else class="space-y-2">
              <div class="grid grid-cols-4 gap-2 text-xs font-medium px-2"
                style="color: var(--color-text-muted);">
                <span>Asset / Komponen</span>
                <span>Threat</span>
                <span>Impact</span>
                <span>Notes</span>
              </div>
              <div v-for="(row, i) in localAnswer.tableRows" :key="i"
                class="grid grid-cols-4 gap-2 items-center">
                <input v-model="row.asset" class="input-field text-xs py-2 px-2.5" placeholder="e.g. API Login" @input="emitUpdate" />
                <input v-model="row.threat" class="input-field text-xs py-2 px-2.5" placeholder="e.g. Bruteforce" @input="emitUpdate" />
                <input v-model="row.impact" class="input-field text-xs py-2 px-2.5" placeholder="e.g. High" @input="emitUpdate" />
                <div class="flex gap-1">
                  <input v-model="row.notes" class="input-field text-xs py-2 px-2.5 flex-1" placeholder="Notes" @input="emitUpdate" />
                  <button class="p-1 text-red-500 hover:text-red-400 transition-colors flex-shrink-0 rounded hover:bg-red-500/10" @click="removeRow(i)">
                    <IconX size="12" />
                  </button>
                </div>
              </div>
              <button
                class="w-full py-2 rounded-lg text-xs transition-all border"
                style="border-color: var(--color-border-dim); color: var(--color-text-muted);"
                @click="addRow"
              >+ Add Row</button>
            </div>
          </div>

          <!-- Phase 3: Read-only answer display -->
          <div v-else-if="phase === 3 && answer" class="pt-2">
            <h3 class="text-[10px] font-bold uppercase tracking-widest mb-3" style="color: var(--color-text-muted);">Findings Report (Read-only)</h3>
            <div class="card p-4 rounded-xl text-sm" style="color: var(--color-text-secondary);">
              <div v-if="answer.answerMode === 'freetext'">{{ answer.freeText }}</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="border-b" style="border-color: var(--color-border);">
                      <th class="text-left py-1 pr-3 font-medium" style="color: var(--color-text-muted);">Asset</th>
                      <th class="text-left py-1 pr-3 font-medium" style="color: var(--color-text-muted);">Threat</th>
                      <th class="text-left py-1 pr-3 font-medium" style="color: var(--color-text-muted);">Impact</th>
                      <th class="text-left py-1 font-medium" style="color: var(--color-text-muted);">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in answer.tableRows" :key="i"
                      class="border-b last:border-0" style="border-color: var(--color-border);">
                      <td class="py-1.5 pr-3" style="color: var(--color-text-secondary);">{{ r.asset }}</td>
                      <td class="py-1.5 pr-3" style="color: var(--color-text-secondary);">{{ r.threat }}</td>
                      <td class="py-1.5 pr-3" style="color: var(--color-text-secondary);">{{ r.impact }}</td>
                      <td class="py-1.5" style="color: var(--color-text-muted);">{{ r.notes }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { BlindAnswer } from '@/stores/progress'
import type { Scenario } from '@/data'
import { IconCheck, IconAlertTriangle, IconX } from '@/icons'

const props = defineProps<{
  scenario: Scenario
  index: number
  answer: BlindAnswer
  phase: 1 | 3
}>()

const emit = defineEmits<{
  update: [BlindAnswer]
}>()

const isExpanded = ref(props.index === 0)

const localAnswer = reactive<BlindAnswer>({
  ...props.answer,
  tableRows: props.answer.tableRows?.length ? [...props.answer.tableRows] : [
    { asset: '', threat: '', impact: '', notes: '' }
  ],
})

const isAnswered = computed(() => {
  if (props.phase === 3) return true
  if (localAnswer.answerMode === 'freetext') return (localAnswer.freeText?.trim().length ?? 0) > 10
  return localAnswer.tableRows?.some(r => r.threat.trim()) ?? false
})

function setMode(mode: 'freetext' | 'table') {
  localAnswer.answerMode = mode
  emitUpdate()
}

function addRow() {
  localAnswer.tableRows = localAnswer.tableRows ?? []
  localAnswer.tableRows.push({ asset: '', threat: '', impact: '', notes: '' })
}

function removeRow(i: number) {
  localAnswer.tableRows?.splice(i, 1)
  if (!localAnswer.tableRows?.length) {
    localAnswer.tableRows = [{ asset: '', threat: '', impact: '', notes: '' }]
  }
  emitUpdate()
}

function emitUpdate() {
  emit('update', { ...localAnswer })
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 2000px;
  opacity: 1;
}
</style>
