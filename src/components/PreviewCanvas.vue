<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  svgDataUrl: string
  svgCode: string
  width: number
  height: number
  padding: number
  bgColor: string
  hue: number
  brightness: number
  contrast: number
  saturation: number
  opacity: number
}>()

const emit = defineEmits<{
  (e: 'update:svgCode', value: string): void
  (e: 'optimize'): void
  (e: 'reset-code'): void
}>()

const isFlipped = ref(false)
const isFullscreen = ref(false)
const stageEl = ref<HTMLElement | null>(null)
const stageSize = ref({ width: 0, height: 0 })

let ro: ResizeObserver | undefined

const updateStageSize = () => {
  if (!stageEl.value) return
  const el = stageEl.value
  const style = window.getComputedStyle(el)
  const pl = Number.parseFloat(style.paddingLeft) || 0
  const pr = Number.parseFloat(style.paddingRight) || 0
  const pt = Number.parseFloat(style.paddingTop) || 0
  const pb = Number.parseFloat(style.paddingBottom) || 0
  stageSize.value = {
    width: Math.max(0, el.clientWidth - pl - pr),
    height: Math.max(0, el.clientHeight - pt - pb)
  }
}

onMounted(() => {
  updateStageSize()
  ro = new ResizeObserver(() => updateStageSize())
  if (stageEl.value) ro.observe(stageEl.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
})

watch(
  () => [props.width, props.height, props.padding, props.bgColor, isFullscreen.value],
  () => updateStageSize()
)

const previewStyle = computed(() => {
  const filters = []
  if (props.hue !== 0) filters.push(`hue-rotate(${props.hue}deg)`)
  if (props.brightness !== 100) filters.push(`brightness(${props.brightness}%)`)
  if (props.contrast !== 100) filters.push(`contrast(${props.contrast}%)`)
  if (props.saturation !== 100) filters.push(`saturate(${props.saturation}%)`)
  if (props.opacity !== 100) filters.push(`opacity(${props.opacity}%)`)
  
  return {
    backgroundColor: props.bgColor === 'transparent' ? 'transparent' : props.bgColor,
    padding: `${(props.padding || 0) / props.height * 100}% ${(props.padding || 0) / props.width * 100}%`,
    filter: filters.join(' ') || 'none'
  }
})

const boxStyle = computed(() => {
  const w = Math.max(1, props.width || 1)
  const h = Math.max(1, props.height || 1)
  const ratio = w / h

  const aw = stageSize.value.width || 0
  const ah = stageSize.value.height || 0

  if (!aw || !ah) {
    return {
      width: '1px',
      height: '1px',
      backgroundColor: previewStyle.value.backgroundColor
    }
  }

  let bw = aw
  let bh = bw / ratio
  if (bh > ah) {
    bh = ah
    bw = bh * ratio
  }

  return {
    width: `${bw}px`,
    height: `${bh}px`,
    backgroundColor: previewStyle.value.backgroundColor
  }
})

const handleCodeChange = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:svgCode', target.value)
}
</script>

<template>
  <div 
    class="relative w-full h-full perspective-1000 group transition-all duration-300"
  >
    <div 
      class="relative w-full h-full transition-all duration-500 transform-style-3d"
      :class="{ 'rotate-y-180': isFlipped }"
    >
      <!-- Front: Image Preview -->
      <div
        class="absolute inset-0 backface-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-700 shadow-inner"
        :class="[isFlipped ? 'pointer-events-none' : '', isFullscreen ? '!rounded-3xl' : '']"
      >
        <!-- Checkerboard background (Always visible behind transparent images) -->
        <div class="absolute inset-0 opacity-20"
          style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;">
        </div>
        
        <!-- Image Preview Container -->
        <div 
          class="relative z-10 w-full h-full flex items-center justify-center overflow-hidden"
          :class="isFullscreen ? 'p-0' : 'p-8'"
          ref="stageEl"
        >
          <div 
            class="relative flex items-center justify-center transition-all duration-300 box-border"
            :class="isFullscreen ? '' : 'shadow-2xl'"
            :style="boxStyle"
          >
            <!-- Border for bounds -->
            <div class="absolute inset-0 border-2 border-dashed border-gray-400/50 dark:border-gray-500/50 pointer-events-none z-20"></div>

            <img
              :src="svgDataUrl"
              :style="{
                padding: `${(padding || 0) / height * 100}% ${(padding || 0) / width * 100}%`,
                filter: previewStyle.filter
              }"
              class="w-full h-full object-contain block box-border transition-all duration-300"
              alt="SVG Preview"
            />
          </div>
        </div>
        
        <!-- Top Right Buttons -->
        <div class="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 translate-y-[-10px] group-hover:translate-y-0">
          <!-- Fullscreen Toggle -->
          <button 
            @click="isFullscreen = !isFullscreen"
            class="bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            :title="isFullscreen ? '恢复边距' : '铺满预览区'"
          >
            <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ isFullscreen ? '恢复' : '铺满' }}
          </button>

          <!-- View Source -->
          <button 
            @click="isFlipped = true"
            class="bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            查看源码
          </button>
        </div>
      </div>

      <!-- Back: Code Editor -->
      <div
        class="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        :class="isFlipped ? '' : 'pointer-events-none'"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <h3 class="text-sm font-bold text-slate-300 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            SVG 源码编辑
          </h3>
          <div class="flex items-center gap-2">
            <button 
              @click="emit('reset-code')"
              class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              title="还原到初始代码"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              还原
            </button>
            <button 
              @click="emit('optimize')"
              class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              title="使用 SVGO 优化代码"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              SVGO 优化
            </button>
            <button 
              @click="isFlipped = false"
              class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              返回预览
            </button>
          </div>
        </div>
        
        <div class="flex-1 relative">
          <textarea
            :value="svgCode"
            @input="handleCodeChange"
            class="w-full h-full bg-slate-900 text-slate-300 font-mono text-xs p-6 resize-none focus:outline-none custom-scrollbar leading-relaxed"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
.transform-style-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #0f172a;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 3px;
}
</style>
