<template>
  <fieldset class="q" :class="{ answered: submitted, right: submitted && isCorrect, wrong: submitted && !isCorrect }"
    :style="{ '--cat': color }">
    <legend class="q-text"><span class="q-no t-mono">Q{{ index + 1 }}</span>{{ question.question }}</legend>

    <div class="opts">
      <button
        v-for="(opt, i) in question.options" :key="i"
        type="button"
        class="opt"
        :class="optClass(i)"
        :disabled="submitted"
        :aria-pressed="selected === i"
        @click="$emit('select', i)"
      >
        <span class="opt-key t-mono">
          <IconCheck v-if="submitted && i === question.correct" :size="14" stroke-width="3" />
          <IconX v-else-if="submitted && i === selected" :size="14" stroke-width="3" />
          <template v-else>{{ String.fromCharCode(65 + i) }}</template>
        </span>
        <span>{{ opt }}</span>
      </button>
    </div>

    <p v-if="submitted" class="why">
      <b>{{ isCorrect ? 'Correct.' : 'Not this one.' }}</b> {{ question.explanation }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconCheck, IconX } from '@tabler/icons-vue'

const props = defineProps<{
  question: { question: string; options: string[]; correct: number; explanation: string }
  index: number
  color: string
  selected: number | null
  submitted: boolean
  dark?: boolean
}>()
defineEmits<{ select: [index: number] }>()

const isCorrect = computed(() => props.selected === props.question.correct)

function optClass(i: number) {
  if (!props.submitted) return { picked: props.selected === i }
  return {
    correct: i === props.question.correct,
    missed: i === props.selected && i !== props.question.correct,
    faded: i !== props.question.correct && i !== props.selected,
  }
}
</script>

<style scoped>
.q { border: 0; margin: 0; padding: 0 0 16px; border-bottom: 1px dashed var(--color-paper-line); min-width: 0; }
.q-text { display: flex; gap: 10px; font-size: 16px; font-weight: 600; line-height: 1.45; margin-bottom: 12px; padding: 0; }
.q-no { font-size: 12px; color: var(--cat); padding-top: 3px; flex-shrink: 0; }

.opts { display: grid; gap: 6px; padding-left: 30px; }
.opt {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--color-paper-line);
  border-radius: 3px;
  background: #F6F2E8;
  font-size: 15px;
  color: var(--color-pen);
  cursor: pointer;
}
.opt:not(:disabled):hover { border-color: var(--color-pen-3); background: #FBF8F1; }
.opt:disabled { cursor: default; }
.opt-key {
  display: grid; place-items: center;
  width: 24px; height: 24px; flex-shrink: 0;
  border: 1px solid var(--color-paper-line);
  border-radius: 2px;
  font-size: 12px;
  background: #FBF8F1;
}
.opt.picked { border-color: var(--color-pen); box-shadow: inset 0 0 0 1px var(--color-pen); background: #FBF8F1; }
.opt.picked .opt-key { background: var(--color-pen); color: var(--color-paper); border-color: var(--color-pen); }
.opt.correct { border-color: #2F7D57; background: #2F7D5714; }
.opt.correct .opt-key { background: #2F7D57; border-color: #2F7D57; color: #fff; }
.opt.missed { border-color: #B8321F; background: #B8321F10; }
.opt.missed .opt-key { background: #B8321F; border-color: #B8321F; color: #fff; }
.opt.faded { opacity: .55; }

.why { margin: 10px 0 0 30px; font-size: 14px; line-height: 1.55; color: var(--color-pen-2); }
.right .why b { color: #2F7D57; }
.wrong .why b { color: #B8321F; }

@media (max-width: 640px) { .opts, .why { padding-left: 0; margin-left: 0; } }
</style>
