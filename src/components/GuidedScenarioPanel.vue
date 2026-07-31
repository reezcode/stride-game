<template>
  <div class="card overflow-hidden" :class="isExpanded ? 'ring-1' : ''"
    :style="isExpanded ? 'ring-color: rgba(78,205,196,0.3)' : ''">
    <!-- Header -->
    <button class="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all"
      @click="isExpanded = !isExpanded">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm flex-shrink-0"
        style="background: rgba(78,205,196,0.1); border: 1px solid rgba(78,205,196,0.25); color: #4ECDC4;">
        {{ scenario.code }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm">{{ scenario.title }}</div>
        <div class="text-xs mt-0.5 truncate" style="color: var(--color-text-muted);">{{ scenario.description }}</div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-xs font-medium px-2 py-0.5 rounded-full"
          :style="hasSelection
            ? 'background: rgba(78,205,196,0.15); color: #4ECDC4; border: 1px solid rgba(78,205,196,0.3)'
            : 'background: rgba(255,179,71,0.1); color: #FFB347; border: 1px solid rgba(255,179,71,0.25)'">
          {{ hasSelection ? `${selectedCount} ancaman dipilih` : 'Belum ada pilihan' }}
        </span>
        <span class="transition-transform duration-200 text-gray-500" :class="{ 'rotate-180': isExpanded }">▼</span>
      </div>
    </button>

    <Transition name="expand">
      <div v-if="isExpanded" class="border-t" style="border-color: var(--color-border);">
        <div class="p-5 space-y-6">
          <!-- Context reminder -->
          <div class="card-elevated p-4 rounded-xl">
            <p class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--color-text-muted);">Scenario Context</p>
            <p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">{{ scenario.context }}</p>
          </div>

          <!-- Blind answer reminder -->
          <div v-if="blindAnswer" class="rounded-xl p-4"
            style="background: rgba(255,107,157,0.05); border: 1px solid rgba(255,107,157,0.15);">
            <p class="text-xs font-semibold uppercase tracking-wider mb-2"
              style="color: #FF6B9D; display: flex; align-items: center; gap: 0.4rem;">
              <IconNote size="12" /> Your Blind Review Answer
            </p>
            <div v-if="blindAnswer.answerMode === 'freetext'" class="text-sm italic" style="color: var(--color-text-secondary);">
              "{{ blindAnswer.freeText }}"
            </div>
            <div v-else class="text-xs" style="color: var(--color-text-secondary);">
              <span v-for="r in blindAnswer.tableRows?.filter(rr => rr.threat)" :key="r.threat"
                class="inline-block mr-2 px-2 py-0.5 rounded-full mb-1"
                style="background: rgba(255,107,157,0.1); color: #FF6B9D; border: 1px solid rgba(255,107,157,0.2);">
                {{ r.threat }}
              </span>
            </div>
          </div>

          <!-- STRIDE Classification Table -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-muted);">STRIDE Classification</p>
            <div class="space-y-3">
              <div v-for="cat in localAnswer.strideCategories" :key="cat.category"
                class="rounded-xl border transition-all duration-200"
                :style="cat.selected
                  ? `border-color: ${strideData[cat.category].borderColor}; background: ${strideData[cat.category].bgColor}`
                  : 'border-color: var(--color-border-dim); background: var(--color-bg-elevated)'">
                <!-- Category toggle header -->
                <button class="w-full flex items-center gap-3 p-3.5 text-left"
                  @click="toggleCategory(cat.category)">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :style="`background: ${strideData[cat.category].bgColor}; border: 1px solid ${strideData[cat.category].borderColor}; color: ${strideData[cat.category].color}`">
                    <component :is="strideIcons[cat.category]" size="18" stroke="2" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold font-mono" :style="`color: ${strideData[cat.category].color}`">
                        {{ cat.category }}
                      </span>
                      <span class="text-sm font-medium" style="color: var(--color-text-primary);">
                        {{ strideData[cat.category].name }}
                      </span>
                    </div>
                    <div class="text-xs mt-0.5" style="color: var(--color-text-muted);">
                      {{ strideData[cat.category].tagline }}
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                      :style="cat.selected
                        ? `background: ${strideData[cat.category].color}; border-color: ${strideData[cat.category].color}`
                        : 'border-color: var(--color-border-dim); background: transparent'">
                      <IconCheck v-if="cat.selected" size="12" stroke="3" style="color: white;" />
                    </div>
                  </div>
                </button>

                <!-- Expanded fields when selected -->
                <Transition name="form-slide">
                  <div v-if="cat.selected" class="px-4 pb-4 space-y-3"
                    style="border-top: 1px solid var(--color-border);">
                    <div class="pt-3 grid sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-muted);">
                          Finding / Threat Description *
                        </label>
                        <textarea
                          v-model="cat.finding"
                          class="textarea-field text-xs"
                          rows="3"
                          :placeholder="`Jelaskan ancaman ${cat.category} yang kamu temukan...`"
                          @input="emitUpdate"
                        />
                      </div>
                      <div class="space-y-3">
                        <div>
                          <label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-muted);">Severity</label>
                          <div class="grid grid-cols-2 gap-1.5">
                            <button v-for="sev in severities" :key="sev.value"
                              class="py-1.5 rounded-lg text-xs font-medium border transition-all"
                              :style="cat.severity === sev.value
                                ? `background: ${sev.bg}; border-color: ${sev.border}; color: ${sev.color}`
                                : 'background: var(--color-bg-base); border-color: var(--color-border-dim); color: var(--color-text-muted)'"
                              @click="cat.severity = sev.value as any; emitUpdate()">
                              {{ sev.label }}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-muted);">Mitigation Recommendation</label>
                          <textarea
                            v-model="cat.recommendation"
                            class="textarea-field text-xs"
                            rows="2"
                            placeholder="Apa yang harus diperbaiki?"
                            @input="emitUpdate"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
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
import type { GuidedAnswer, BlindAnswer } from '@/stores/progress'
import type { Scenario } from '@/data'
import { strideData } from '@/data'
import { strideIcons, IconNote, IconCheck } from '@/icons'

const props = defineProps<{
  scenario: Scenario
  index: number
  blindAnswer?: BlindAnswer
  guidedAnswer: GuidedAnswer
}>()

const emit = defineEmits<{ update: [GuidedAnswer] }>()

const isExpanded = ref(props.index === 0)

const localAnswer = reactive<GuidedAnswer>({
  ...props.guidedAnswer,
  strideCategories: props.guidedAnswer.strideCategories.map(c => ({ ...c })),
})

const hasSelection = computed(() => localAnswer.strideCategories.some(c => c.selected))
const selectedCount = computed(() => localAnswer.strideCategories.filter(c => c.selected).length)

const severities = [
  { value: 'Critical', label: 'Critical', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.4)' },
  { value: 'High',     label: 'High',     color: '#FFB347', bg: 'rgba(255,179,71,0.15)',  border: 'rgba(255,179,71,0.4)'  },
  { value: 'Medium',   label: 'Medium',   color: '#45B7D1', bg: 'rgba(69,183,209,0.15)', border: 'rgba(69,183,209,0.4)'  },
  { value: 'Low',      label: 'Low',      color: '#96CEB4', bg: 'rgba(150,206,180,0.15)',border: 'rgba(150,206,180,0.4)' },
]

function toggleCategory(cat: string) {
  const found = localAnswer.strideCategories.find(c => c.category === cat)
  if (found) {
    found.selected = !found.selected
    emitUpdate()
  }
}

function emitUpdate() {
  emit('update', { ...localAnswer, strideCategories: localAnswer.strideCategories.map(c => ({ ...c })) })
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
.expand-enter-to, .expand-leave-from { max-height: 3000px; opacity: 1; }
.form-slide-enter-active, .form-slide-leave-active { transition: all 0.25s ease; overflow: hidden; }
.form-slide-enter-from, .form-slide-leave-to { max-height: 0; opacity: 0; }
.form-slide-enter-to { max-height: 600px; opacity: 1; }
</style>
