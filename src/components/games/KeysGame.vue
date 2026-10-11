<!-- Every account holds a ring of keys. Drag the ones it should never have had into the revoke tray. -->
<template>
  <div class="keys">
    <p class="how">{{ $t('game.keysHow') }}</p>
    <div class="board">
      <section v-for="(acct, a) in board" :key="acct.name" class="acct">
        <header><b class="t-mono">{{ acct.name }}</b><span>{{ acct.role }}</span></header>
        <div class="ring">
          <button v-for="(k, i) in acct.keys" v-show="!revoked.includes(id(a, i))" :key="i" class="key" draggable="true"
            @dragstart="held = id(a, i)" @dragend="held = null" @click="revoke(id(a, i))">
            <IconKey :size="15" /> {{ k.text }}
          </button>
          <span v-if="acct.keys.every((_, i) => revoked.includes(id(a, i)))" class="empty">—</span>
        </div>
      </section>
    </div>
    <div class="tray" :class="{ over }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="held && revoke(held); over = false">
      <div class="tray-k"><IconTrash :size="16" /> {{ $t('game.tray') }}</div>
      <button v-for="r in revoked" :key="r" class="key gone" :title="$t('game.giveBack')" @click="revoked.splice(revoked.indexOf(r), 1)">
        <span class="t-mono">{{ label(r).acct }}</span> {{ label(r).text }}
      </button>
      <span v-if="!revoked.length" class="hint">{{ $t('game.trayHint') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconKey, IconTrash } from '@tabler/icons-vue'
import type { Puzzle } from '@/data/story'
import { sfx } from '@/game/audio'
import { t } from '@/i18n'

const props = defineProps<{ puzzle: Puzzle }>()
const emit = defineEmits<{ result: [ok: boolean, note: string] }>()
const board = props.puzzle.board ?? []
const id = (a: number, i: number) => `${a}:${i}`
const key = (r: string) => { const [a, i] = r.split(':').map(Number); return { acct: board[a], k: board[a].keys[i] } }
const label = (r: string) => ({ acct: key(r).acct.name, text: key(r).k.text })
const revoked = ref<string[]>([])
const held = ref<string | null>(null)
const over = ref(false)

function revoke(r: string) { if (!revoked.value.includes(r)) { revoked.value.push(r); sfx.blip() } }
function check() {
  const all = board.flatMap((acct, a) => acct.keys.map((k, i) => ({ r: id(a, i), excess: k.excess })))
  const wrong = all.filter(k => !k.excess && revoked.value.includes(k.r)).length
  const missed = all.filter(k => k.excess && !revoked.value.includes(k.r)).length
  emit('result', !wrong && !missed, t('game.keysNote', { wrong, missed }))
}
defineExpose({ check })
</script>

<style scoped>
.how { margin: 0 0 10px; font-size: 13px; color: var(--color-pen-3); }
.board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.acct { padding: 10px 12px; border: 1px solid var(--color-paper-line); border-radius: 3px; background: #F6F2E8; }
.acct header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.acct header span { font-size: 12px; color: var(--color-pen-3); }
.ring { display: flex; flex-wrap: wrap; gap: 6px; min-height: 30px; }
.key { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid #B89A4E; border-radius: 14px; background: #F2DE9A; color: #3A2E10; font-size: 13px; cursor: grab; }
.key:hover { background: #F7E7B0; }
.key.gone { background: #E9D5D0; border-color: #B8321F; color: #6B1F14; cursor: pointer; text-decoration: line-through; }
.empty { color: var(--color-pen-3); }
.tray { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 58px; margin-top: 10px; padding: 10px 12px; border: 2px dashed #B8321F88; border-radius: 3px; background: #B8321F0D; transition: background-color .15s; }
.tray.over { background: #B8321F26; }
.tray-k { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #B8321F; margin-right: 6px; }
.hint { font-size: 13px; color: var(--color-pen-3); }
@media (max-width: 600px) { .board { grid-template-columns: 1fr; } }
</style>
