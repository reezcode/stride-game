<template>
  <div class="hud">
    <!-- Left: player info -->
    <div class="hud-section">
      <div class="player-badge" :style="`border-color: ${store.playerColor}55;`">
        <div class="mini-char" :style="`background: ${store.playerColor};`">
          <div class="mini-visor"></div>
        </div>
        <div>
          <div class="player-name">{{ store.playerName }}</div>
          <div class="player-sub">Security Detective</div>
        </div>
      </div>
    </div>

    <!-- Center: cases progress -->
    <div class="hud-center">
      <div class="cases-track">
        <div v-for="(t, i) in terminals" :key="t.id"
          class="case-pip"
          :class="getCaseStatus(t.scenarioId)"
          :title="`Case ${i+1}: ${t.label}`">
          <span class="pip-num">{{ i + 1 }}</span>
        </div>
      </div>
      <div class="cases-label">{{ store.solvedCount }}/{{ total }} Cases Solved</div>
    </div>

    <!-- Right: XP + learn button -->
    <div class="hud-section hud-right">
      <button class="learn-btn" @click="router.push('/learn')" title="STRIDE Reference Desk">
        📚
        <span class="learn-label">Learn</span>
        <span v-if="store.phase2Completed" class="learn-check">✓</span>
      </button>
      <div class="xp-badge">
        <div class="xp-icon">⚡</div>
        <div>
          <div class="xp-value">{{ store.totalXP.toLocaleString() }}</div>
          <div class="xp-label">XP</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const store  = useGameStore()
const total  = 5

const terminals = [
  { id: 'T1', scenarioId: 'SC-001', label: 'TX-API' },
  { id: 'T2', scenarioId: 'SC-002', label: 'AUTH-SRV' },
  { id: 'T3', scenarioId: 'SC-003', label: 'FIN-CORE' },
  { id: 'T4', scenarioId: 'SC-004', label: 'ADMIN-01' },
  { id: 'T5', scenarioId: 'SC-005', label: 'STORE-FS' },
]

function getCaseStatus(id: string) {
  const c = store.getCase(id)
  if (!c) return 'pip-locked'
  if (c.solved) return 'pip-solved'
  if (c.visited) return 'pip-visited'
  return 'pip-unvisited'
}
</script>

<style scoped>
.hud {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(8, 8, 18, 0.9);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  z-index: 90;
  gap: 12px;
}

.hud-section { display: flex; align-items: center; gap: 10px; min-width: 0; }
.hud-right { justify-content: flex-end; }

.hud-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

/* Player badge */
.player-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
}
.mini-char {
  width: 22px;
  height: 26px;
  border-radius: 50% 50% 38% 38%;
  position: relative;
  flex-shrink: 0;
}
.mini-visor {
  position: absolute;
  top: 4px; left: 4px; right: 4px;
  height: 8px;
  background: rgba(255,255,255,0.88);
  border-radius: 50% 50% 25% 25%;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
}
.player-name {
  font-size: 12px;
  font-weight: 700;
  color: rgba(232,232,255,0.9);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player-sub {
  font-size: 9px;
  color: rgba(232,232,255,0.35);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Cases track */
.cases-track {
  display: flex;
  gap: 6px;
  align-items: center;
}
.case-pip {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}
.pip-num { line-height: 1; }
.pip-unvisited {
  background: rgba(232,69,60,0.12);
  border-color: rgba(232,69,60,0.3);
  color: rgba(232,69,60,0.6);
}
.pip-visited {
  background: rgba(232,150,10,0.18);
  border-color: rgba(232,150,10,0.4);
  color: #E8960A;
  box-shadow: 0 0 8px rgba(232,150,10,0.2);
}
.pip-solved {
  background: rgba(18,166,122,0.18);
  border-color: rgba(18,166,122,0.5);
  color: #12A67A;
  box-shadow: 0 0 8px rgba(18,166,122,0.25);
}
.cases-label {
  font-size: 9px;
  color: rgba(232,232,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

/* Learn button */
.learn-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(232,232,255,0.7);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.learn-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: rgba(232,232,255,0.95);
}
.learn-label { font-size: 11px; }
.learn-check { color: #12A67A; font-size: 11px; }

/* XP badge */
.xp-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(232,150,10,0.1);
  border: 1px solid rgba(232,150,10,0.25);
}
.xp-icon { font-size: 14px; }
.xp-value {
  font-size: 13px;
  font-weight: 800;
  color: #E8960A;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}
.xp-label {
  font-size: 8px;
  color: rgba(232,150,10,0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
