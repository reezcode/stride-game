<template>
  <div class="player-wrap" :style="`left:${x}px; top:${y}px;`">
    <!-- Shadow -->
    <div class="player-shadow"></div>

    <!-- Body -->
    <div class="player-body"
      :style="`background: ${color};`"
      :class="[`face-${facing}`, { walking: moving }]">
      <!-- Visor -->
      <div class="player-visor"></div>
      <!-- Backpack -->
      <div class="player-pack" :style="`background: color-mix(in srgb, ${color} 70%, #000);`"></div>
    </div>

    <!-- Name tag -->
    <div class="player-tag">{{ name }}</div>

    <!-- Walk dust particles -->
    <div v-if="moving" class="dust-left dust"></div>
    <div v-if="moving" class="dust-right dust"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  x: number
  y: number
  color: string
  facing: 'left' | 'right' | 'up' | 'down'
  moving: boolean
  name: string
}>()
</script>

<style scoped>
.player-wrap {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 20;
  pointer-events: none;
}

.player-shadow {
  position: absolute;
  bottom: -4px;
  width: 28px;
  height: 8px;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  filter: blur(3px);
}

.player-body {
  width: 28px;
  height: 34px;
  border-radius: 50% 50% 38% 38%;
  position: relative;
  transition: transform 0.1s ease;
}

.player-body.face-left  { transform: scaleX(-1); }
.player-body.face-right { transform: scaleX(1); }
.player-body.face-up    { transform: scaleY(0.9) translateY(-2px); }
.player-body.face-down  { transform: scaleY(1); }

.player-body.walking {
  animation: playerWalk 0.28s ease-in-out infinite;
}
@keyframes playerWalk {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50%       { transform: translateY(-3px) rotate(2deg); }
}
.player-body.face-left.walking  { transform: scaleX(-1); animation: playerWalkFlip 0.28s ease-in-out infinite; }
.player-body.face-right.walking { animation: playerWalk 0.28s ease-in-out infinite; }

@keyframes playerWalkFlip {
  0%, 100% { transform: scaleX(-1) translateY(0) rotate(-2deg); }
  50%       { transform: scaleX(-1) translateY(-3px) rotate(2deg); }
}

.player-visor {
  position: absolute;
  top: 6px;
  left: 5px;
  right: 5px;
  height: 11px;
  background: rgba(200,230,255,0.92);
  border-radius: 50% 50% 28% 28%;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.15), 0 0 8px rgba(180,220,255,0.3);
}

.player-pack {
  position: absolute;
  bottom: 4px;
  left: -5px;
  width: 7px;
  height: 14px;
  border-radius: 3px;
}

.player-tag {
  font-size: 9px;
  font-weight: 700;
  color: rgba(232,232,255,0.7);
  white-space: nowrap;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(0,0,0,0.4);
  letter-spacing: 0.04em;
  margin-top: 4px;
}

/* Dust particles */
.dust {
  position: absolute;
  bottom: -2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  animation: dustPoof 0.4s ease-out infinite;
}
.dust-left  { left: -4px; animation-delay: 0s; }
.dust-right { right: -4px; animation-delay: 0.2s; }
@keyframes dustPoof {
  from { opacity: 0.4; transform: scale(1) translateY(0); }
  to   { opacity: 0;   transform: scale(2) translateY(4px); }
}
</style>
