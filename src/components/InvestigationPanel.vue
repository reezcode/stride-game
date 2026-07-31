<template>
  <div class="panel-backdrop" @click.self="$emit('close')">
    <div class="panel-container animate-slide-up">

      <!-- Panel header -->
      <div class="panel-header">
        <div class="panel-title-row">
          <div class="terminal-badge">
            <span class="terminal-dot animate-glow-pulse" style="background:#E8453C; box-shadow: 0 0 6px #E8453C;"></span>
            <span class="terminal-id font-mono">{{ scenario.id }}</span>
          </div>
          <h2 class="panel-title">{{ scenario.title }}</h2>
          <button class="close-btn" @click="$emit('close')" title="Close">✕</button>
        </div>
        <!-- Tabs -->
        <div class="panel-tabs">
          <button
            v-for="tab in tabs" :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </div>
      </div>

      <!-- Panel body -->
      <div class="panel-body">

        <!-- ── Tab: Clues ── -->
        <div v-if="activeTab === 'clues'" class="tab-content animate-fade-in">
          <p class="scenario-context">{{ scenario.context }}</p>

          <!-- Details list -->
          <div class="clue-section">
            <div class="section-label">⚠️ Suspicious Observations</div>
            <ul class="clue-list">
              <li v-for="d in scenario.details" :key="d" class="clue-item">
                <span class="clue-bullet">›</span> {{ d }}
              </li>
            </ul>
          </div>

          <!-- System info cards -->
          <div class="clue-section">
            <div class="section-label">🖥️ System Evidence</div>
            <div v-for="(info, i) in scenario.systemInfo" :key="i" class="sys-card">
              <div v-if="info.endpoint" class="sys-row">
                <span class="sys-label">Endpoint</span>
                <code class="sys-code endpoint">{{ info.endpoint }}</code>
              </div>
              <div v-if="info.request" class="sys-row">
                <span class="sys-label">Request</span>
                <pre class="sys-pre">{{ info.request }}</pre>
              </div>
              <div v-if="info.response" class="sys-row">
                <span class="sys-label">Response</span>
                <pre class="sys-pre response">{{ info.response }}</pre>
              </div>
              <div v-if="info.note" class="sys-note">
                <span>💡</span> {{ info.note }}
              </div>
            </div>
          </div>

          <!-- Hints (togglable) -->
          <div class="clue-section">
            <button class="hint-toggle" @click="showHints = !showHints">
              {{ showHints ? '🔒 Hide' : '💡 Show' }} Detective Hints
            </button>
            <Transition name="hint-reveal">
              <ul v-if="showHints" class="hint-list">
                <li v-for="h in scenario.hints" :key="h" class="hint-item">
                  <span>🔍</span> {{ h }}
                </li>
              </ul>
            </Transition>
          </div>
        </div>

        <!-- ── Tab: File Report ── -->
        <div v-if="activeTab === 'report'" class="tab-content animate-fade-in">

          <div class="report-intro">
            <p>Select all applicable <strong>STRIDE threat categories</strong> you identified in this system. For each, provide a title and explanation.</p>
          </div>

          <!-- STRIDE category selector -->
          <div class="stride-grid">
            <button
              v-for="cat in strideCategories" :key="cat.letter"
              class="stride-chip"
              :class="{ selected: selectedCats.includes(cat.letter) }"
              :style="selectedCats.includes(cat.letter)
                ? `background: ${cat.color}22; border-color: ${cat.color}77; color: ${cat.color};`
                : `border-color: rgba(255,255,255,0.1); color: rgba(232,232,255,0.5);`"
              @click="toggleCat(cat.letter)"
            >
              <span class="chip-letter">{{ cat.letter }}</span>
              <span class="chip-name">{{ cat.name }}</span>
            </button>
          </div>

          <!-- Concern forms per selected category -->
          <Transition name="concerns-fade">
            <div v-if="selectedCats.length > 0" class="concerns-list">
              <ConcernCard
                v-for="cat in selectedCats" :key="cat"
                :category="cat"
                :concern="getConcern(cat)"
                @update="updateConcern(cat, $event)"
              />
            </div>
          </Transition>

          <div v-if="selectedCats.length === 0" class="empty-hint">
            ← Select at least one STRIDE category above to file a concern
          </div>
        </div>
      </div>

      <!-- Panel footer -->
      <div class="panel-footer">
        <div class="footer-left">
          <span v-if="activeTab === 'report' && selectedCats.length > 0" class="concern-count">
            {{ selectedCats.length }} concern{{ selectedCats.length > 1 ? 's' : '' }} filed
          </span>
        </div>
        <div class="footer-right">
          <button class="btn-game text-sm py-2.5 px-5" @click="$emit('close')">Cancel</button>
          <button
            v-if="activeTab === 'clues'"
            class="btn-game-accent py-2.5 px-6"
            style="background: rgba(34,118,210,0.2); border-color: rgba(34,118,210,0.5); color: #7BB8F5;"
            @click="activeTab = 'report'"
          >
            File Report →
          </button>
          <button
            v-else
            class="btn-game-accent py-2.5 px-6"
            :style="canSubmit
              ? 'background: rgba(18,166,122,0.2); border-color: rgba(18,166,122,0.5); color: #4ECDA4;'
              : 'opacity:0.35; cursor:not-allowed; background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:rgba(255,255,255,0.3);'"
            :disabled="!canSubmit"
            @click="sealCase"
          >
            🔒 Seal the Case
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, type FiledConcern } from '@/stores/game'
import { scenarios } from '@/data'
import ConcernCard from '@/components/ConcernCard.vue'

const props = defineProps<{ scenarioId: string }>()
const emit  = defineEmits<{
  close: []
  solved: [xp: number]
}>()

const store    = useGameStore()
const scenario = computed(() => scenarios.find(s => s.id === props.scenarioId)!)
const tabs = [
  { id: 'clues'  as const, label: '🔍 Clues' },
  { id: 'report' as const, label: '📋 File Report' },
]
const activeTab  = ref<'clues'|'report'>('clues')
const showHints  = ref(false)
const selectedCats = ref<string[]>([])
const concerns     = ref<Record<string, Omit<FiledConcern, 'id'|'category'>>>({})

const strideCategories = [
  { letter: 'S', name: 'Spoofing',              color: '#E8453C' },
  { letter: 'T', name: 'Tampering',             color: '#E8960A' },
  { letter: 'R', name: 'Repudiation',           color: '#12A67A' },
  { letter: 'I', name: 'Info Disclosure',       color: '#2276D2' },
  { letter: 'D', name: 'Denial of Service',     color: '#52A882' },
  { letter: 'E', name: 'Elevation of Privilege', color: '#7B41E0' },
]

function toggleCat(letter: string) {
  const idx = selectedCats.value.indexOf(letter)
  if (idx === -1) selectedCats.value.push(letter)
  else selectedCats.value.splice(idx, 1)
}

function getConcern(cat: string) {
  return concerns.value[cat] ?? { title: '', explanation: '', severity: 'High' as const }
}

function updateConcern(cat: string, data: Omit<FiledConcern, 'id'|'category'>) {
  concerns.value[cat] = data
}

const canSubmit = computed(() =>
  selectedCats.value.length > 0 &&
  selectedCats.value.every(cat => {
    const c = concerns.value[cat]
    return c && c.title.trim().length > 0
  })
)

function sealCase() {
  if (!canSubmit.value) return
  const filed: FiledConcern[] = selectedCats.value.map(cat => ({
    id: `${props.scenarioId}-${cat}`,
    category: cat as FiledConcern['category'],
    title: concerns.value[cat].title,
    explanation: concerns.value[cat].explanation,
    severity: concerns.value[cat].severity,
  }))
  store.solveCase(props.scenarioId, filed)
  const c = store.getCase(props.scenarioId)
  emit('solved', c?.xpEarned ?? 0)
}
</script>

<style scoped>
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  cursor: default;
}

.panel-container {
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  background: var(--game-bg-room);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
}

/* Header */
.panel-header {
  padding: 20px 24px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.terminal-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(232,69,60,0.12);
  border: 1px solid rgba(232,69,60,0.3);
  flex-shrink: 0;
}
.terminal-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.terminal-id {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #E8453C;
  font-family: 'JetBrains Mono', monospace;
}
.panel-title {
  flex: 1;
  font-size: 16px;
  font-weight: 800;
  color: var(--game-text);
  line-height: 1.2;
}
.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(232,232,255,0.5);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.close-btn:hover { background: rgba(255,255,255,0.12); color: var(--game-text); }

/* Tabs */
.panel-tabs { display: flex; gap: 4px; padding-bottom: 1px; }
.tab-btn {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px 8px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  cursor: pointer;
  transition: all 0.15s;
  color: rgba(232,232,255,0.4);
  background: transparent;
}
.tab-btn:hover { color: rgba(232,232,255,0.7); }
.tab-btn.active {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.1);
  border-bottom: 1px solid var(--game-bg-room);
  color: var(--game-text);
  margin-bottom: -1px;
}

/* Body */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.tab-content { display: flex; flex-direction: column; gap: 16px; }

.scenario-context {
  font-size: 13px;
  line-height: 1.7;
  color: var(--game-text-dim);
  padding: 12px 14px;
  background: rgba(255,255,255,0.03);
  border-left: 3px solid rgba(232,69,60,0.4);
  border-radius: 0 8px 8px 0;
}

.clue-section { display: flex; flex-direction: column; gap: 8px; }
.section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232,232,255,0.35);
}

.clue-list { display: flex; flex-direction: column; gap: 6px; list-style: none; padding: 0; margin: 0; }
.clue-item {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
  color: var(--game-text-dim);
  line-height: 1.5;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 7px;
}
.clue-bullet { color: #E8453C; font-weight: 900; flex-shrink: 0; }

.sys-card {
  background: #080814;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  overflow: hidden;
}
.sys-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sys-row:last-of-type { border-bottom: none; }
.sys-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.25);
}
.sys-code {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: #7BB8F5;
  font-weight: 600;
}
.sys-pre {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(232,232,255,0.7);
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}
.sys-pre.response { color: #4ECDA4; }
.sys-note {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 11px;
  color: rgba(232,150,10,0.8);
  padding: 8px 12px;
  background: rgba(232,150,10,0.06);
  line-height: 1.5;
}

/* Hints */
.hint-toggle {
  font-size: 11px;
  font-weight: 700;
  color: rgba(232,232,255,0.4);
  background: rgba(255,255,255,0.04);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 7px;
  padding: 7px 12px;
  cursor: pointer;
  transition: all 0.15s;
  align-self: flex-start;
}
.hint-toggle:hover { color: rgba(232,232,255,0.7); border-color: rgba(255,255,255,0.2); }
.hint-list { display: flex; flex-direction: column; gap: 6px; list-style: none; padding: 0; margin: 0; }
.hint-item {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: rgba(232,150,10,0.8);
  padding: 8px 10px;
  background: rgba(232,150,10,0.06);
  border: 1px solid rgba(232,150,10,0.15);
  border-radius: 7px;
  line-height: 1.5;
}

.hint-reveal-enter-active, .hint-reveal-leave-active { transition: all 0.25s ease; }
.hint-reveal-enter-from, .hint-reveal-leave-to { opacity: 0; transform: translateY(-8px); }

/* Report tab */
.report-intro {
  font-size: 12.5px;
  color: var(--game-text-dim);
  line-height: 1.6;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}
.report-intro strong { color: var(--game-text); }

.stride-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stride-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 8px;
  border-radius: 10px;
  border: 1.5px solid;
  cursor: pointer;
  transition: all 0.18s ease;
  background: transparent;
}
.stride-chip:hover { transform: translateY(-2px); filter: brightness(1.2); }
.chip-letter {
  font-size: 20px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}
.chip-name { font-size: 9px; font-weight: 700; text-align: center; line-height: 1.2; }

.concerns-list { display: flex; flex-direction: column; gap: 12px; }
.concerns-fade-enter-active, .concerns-fade-leave-active { transition: all 0.25s ease; }
.concerns-fade-enter-from, .concerns-fade-leave-to { opacity: 0; transform: translateY(8px); }

.empty-hint {
  text-align: center;
  font-size: 12px;
  color: rgba(232,232,255,0.25);
  padding: 24px;
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 10px;
}

/* Footer */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  flex-shrink: 0;
  gap: 12px;
}
.footer-left { min-width: 0; }
.footer-right { display: flex; align-items: center; gap: 8px; }
.concern-count {
  font-size: 12px;
  font-weight: 700;
  color: rgba(18,166,122,0.8);
  font-family: 'JetBrains Mono', monospace;
}
</style>
