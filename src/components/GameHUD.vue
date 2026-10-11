<template>
  <header class="hud">
    <div class="who">
      <DetectiveAvatar :color="store.playerColor" :size="34" />
      <div class="who-text">
        <div class="who-name">{{ store.playerName }}</div>
        <div class="who-rank">{{ rank }}</div>
      </div>
    </div>

    <ol class="cases" aria-label="Cases">
      <li v-for="c in caseRows" :key="c.id" :class="['case', c.status]" :title="`${c.room} — ${c.label}`">
        <span class="case-dot"></span>
        <span class="case-room">{{ c.room }}</span>
      </li>
    </ol>

    <div class="tools">
      <div class="stat" title="Evidence collected">
        <IconFileSearch :size="16" stroke-width="1.8" />
        <span class="t-mono">{{ store.evidenceCount }}<span class="dim">/{{ store.evidenceTotal }}</span></span>
      </div>
      <div class="stat xp" title="Experience">
        <span class="t-mono">{{ store.totalXP.toLocaleString() }}</span>
        <span class="dim t-mono">XP</span>
      </div>
      <button class="icon-btn" title="STRIDE field manual" @click="$emit('manual')">
        <IconBook2 :size="18" stroke-width="1.8" />
      </button>
      <button class="icon-btn" :title="muted ? 'Unmute (M)' : 'Mute (M)'" @click="$emit('toggleSound')">
        <IconVolumeOff v-if="muted" :size="18" stroke-width="1.8" />
        <IconVolume v-else :size="18" stroke-width="1.8" />
      </button>
      <button class="icon-btn" title="Menu (Esc)" @click="$emit('menu')">
        <IconMenu2 :size="18" stroke-width="1.8" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconBook2, IconVolume, IconVolumeOff, IconMenu2, IconFileSearch } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { rooms } from '@/game/world'
import { scenarios } from '@/data'
import { rankFor } from '@/game/stride'
import DetectiveAvatar from './DetectiveAvatar.vue'

defineProps<{ muted: boolean }>()
defineEmits<{ manual: []; menu: []; toggleSound: [] }>()

const store = useGameStore()
const rank = computed(() => rankFor(store.totalXP))

const caseRows = computed(() => scenarios.map(s => {
  const c = store.getCase(s.id)
  const room = rooms.find(r => r.scenarioId === s.id)
  return {
    id: s.id,
    label: s.title,
    room: room?.name ?? s.id,
    status: c?.solved ? 'solved' : c?.visited ? 'visited' : 'breach',
  }
}))
</script>

<style scoped>
.hud {
  position: fixed;
  inset: 0 0 auto 0;
  height: 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 0 12px 0 10px;
  padding-top: env(safe-area-inset-top);
  background: linear-gradient(#0B0E13F2, #0B0E13D9);
  border-bottom: 1px solid var(--color-ink-line);
  z-index: 40;
}

.who { display: flex; align-items: center; gap: 8px; min-width: 0; }
.who-text { min-width: 0; }
.who-name {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.who-rank { font-size: 12px; color: var(--color-fog-dim); line-height: 1.2; }

.cases { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; }
.case {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--color-ink-line);
  border-radius: 3px;
  font-size: 12px;
  color: var(--color-fog-dim);
  white-space: nowrap;
}
.case-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.case.breach .case-dot { background: var(--color-alarm); box-shadow: 0 0 0 3px #D9432F26; }
.case.visited .case-dot { background: var(--color-amber); }
.case.visited { color: var(--color-fog); }
.case.solved .case-dot { background: var(--color-secure); }
.case.solved { color: var(--color-fog); border-color: #3D9A6C55; }

.tools { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  color: var(--color-fog);
}
.stat .dim, .dim { color: var(--color-fog-mute); }
.stat.xp { color: #F0C674; gap: 4px; }
.icon-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 3px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-fog-dim);
  cursor: pointer;
}
.icon-btn:hover { background: var(--color-ink-800); color: var(--color-fog); border-color: var(--color-ink-line); }

@media (max-width: 1100px) {
  .case-room { display: none; }
  .case { padding: 0 9px; }
}
@media (max-width: 640px) {
  .hud { grid-template-columns: auto 1fr auto; gap: 8px; }
  .who-text { display: none; }
  .cases { justify-content: center; }
  .case { padding: 0 7px; height: 26px; }
  .stat:first-child { display: none; }
  .icon-btn { width: 32px; }
}
</style>
