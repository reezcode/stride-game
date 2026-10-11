<template>
  <section class="concern" :style="{ '--cat': meta.color }">
    <header class="concern-head">
      <span class="letter">{{ category }}</span>
      <div>
        <div class="name">{{ meta.question }}</div>
        <div class="question">{{ meta.name }}</div>
      </div>
    </header>

    <div class="concern-body">
      <label class="lbl" :for="`title-${category}`">{{ $t('concern.finding') }} <span class="req">{{ $t('concern.required') }}</span></label>
      <input
        :id="`title-${category}`"
        v-model="localTitle"
        class="field"
        :placeholder="$t('concern.ph')"
        maxlength="80"
        @input="emitUpdate"
      />

      <div class="lbl">{{ $t('concern.severity') }}</div>
      <div class="sev" role="radiogroup" :aria-label="$t('concern.severity')">
        <button
          v-for="sev in SEVERITIES" :key="sev.id"
          type="button"
          role="radio"
          :aria-checked="localSeverity === sev.id"
          :class="{ on: localSeverity === sev.id }"
          :style="{ '--sev': sev.color }"
          @click="setSeverity(sev.id)"
        >{{ $t(`sev.${sev.id}`) }}</button>
      </div>

      <label class="lbl" :for="`exp-${category}`">{{ $t('concern.reasoning') }} <span class="opt">{{ $t('concern.optional') }}</span></label>
      <textarea
        :id="`exp-${category}`"
        v-model="localExplanation"
        class="field"
        rows="2"
        maxlength="500"
        :placeholder="$t('concern.ph2')"
        @input="emitUpdate"
      ></textarea>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FiledConcern, Severity } from '@/stores/game'
import { STRIDE_BY, SEVERITIES } from '@/game/stride'

const props = defineProps<{
  category: string
  concern: Omit<FiledConcern, 'id' | 'category'>
}>()
const emit = defineEmits<{
  update: [data: Omit<FiledConcern, 'id' | 'category'>]
}>()

const meta = computed(() => STRIDE_BY[props.category] ?? STRIDE_BY.S)

const localTitle       = ref(props.concern.title)
const localSeverity    = ref<Severity>(props.concern.severity)
const localExplanation = ref(props.concern.explanation)

watch(() => props.concern, c => {
  localTitle.value       = c.title
  localSeverity.value    = c.severity
  localExplanation.value = c.explanation
}, { deep: true })

function setSeverity(s: Severity) {
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
.concern {
  border: 1px solid var(--color-paper-line);
  border-left: 4px solid var(--cat);
  border-radius: 3px;
  background: #F6F2E8;
}
.concern-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px 10px;
  border-bottom: 1px dashed var(--color-paper-line);
}
.letter {
  font-family: var(--font-cond);
  font-weight: 700;
  font-size: 28px;
  line-height: 1;
  color: var(--cat);
  width: 22px;
  flex-shrink: 0;
}
.name { font-weight: 700; font-size: 15px; line-height: 1.25; }
.question { font-size: 13px; color: var(--color-pen-3); line-height: 1.4; }

.concern-body { padding: 12px 14px 14px; display: grid; gap: 6px; }
.lbl { font-size: 13px; font-weight: 600; color: var(--color-pen-2); margin-top: 6px; }
.lbl:first-child { margin-top: 0; }
.req, .opt { font-weight: 400; color: var(--color-pen-3); font-size: 12px; margin-left: 4px; }

.sev { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.sev button {
  height: 32px;
  border: 1px solid var(--color-paper-line);
  border-radius: 3px;
  background: #FBF8F1;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-pen-2);
  cursor: pointer;
}
.sev button:hover { border-color: var(--color-pen-3); }
.sev button.on {
  background: var(--sev);
  border-color: var(--sev);
  color: #fff;
  font-weight: 600;
}
</style>
