<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  scale: number
  lockAspectRatio: boolean
  
  // Style
  padding: number
  bgColor: string
  
  // Filters
  hue: number
  brightness: number
  contrast: number
  saturation: number
  opacity: number
  
  // Output
  outputFormat: 'png' | 'jpeg' | 'webp' | 'ico'
  fileName: string
  isGenerating: boolean
}>()

const emit = defineEmits<{
  (e: 'update:width', value: number): void
  (e: 'update:height', value: number): void
  (e: 'update:lockAspectRatio', value: boolean): void
  
  (e: 'update:padding', value: number): void
  (e: 'update:bgColor', value: string): void
  
  (e: 'update:hue', value: number): void
  (e: 'update:brightness', value: number): void
  (e: 'update:contrast', value: number): void
  (e: 'update:saturation', value: number): void
  (e: 'update:opacity', value: number): void
  
  (e: 'update:outputFormat', value: string): void
  
  (e: 'download'): void
  (e: 'reset'): void
}>()

const presetSizes = [16, 32, 64, 128, 256, 512, 1024]

const bgOptions = [
  { label: '透明', value: 'transparent', class: 'bg-white bg-grid-slate-200/50' }, // Custom grid class for transparent look
  { label: '纯白', value: '#ffffff', class: 'bg-white' },
  { label: '纯黑', value: '#000000', class: 'bg-black' },
]

const formatOptions = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
  { label: 'ICO', value: 'ico' },
]

const showFilters = ref(false)
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700 h-full overflow-y-auto custom-scrollbar">
    <!-- Removed Title Header -->

    <!-- 1. 尺寸 Dimensions -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="text-sm font-bold text-slate-700 dark:text-slate-300">尺寸设置</label>
        
        <!-- Preset Sizes Dropdown -->
        <select 
          @change="(e) => { 
            const val = Number((e.target as HTMLSelectElement).value);
            if (val > 0) {
              emit('update:width', val); 
              emit('update:height', val); 
              // Reset select to default after selection to allow re-selecting same value if needed
              (e.target as HTMLSelectElement).value = '';
            }
          }"
          class="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
        >
          <option value="" disabled selected>选择预设尺寸</option>
          <option v-for="size in presetSizes" :key="size" :value="size">{{ size }} x {{ size }}</option>
        </select>
      </div>

      <!-- Dimensions Inputs with Lock in Middle -->
      <div class="flex items-end gap-2">
        <div class="space-y-1 flex-1">
          <label class="text-xs text-slate-500 dark:text-slate-400">宽度 (W)</label>
          <input
            type="number"
            :value="width"
            @input="e => emit('update:width', Number((e.target as HTMLInputElement).value))"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 no-spinner"
          />
        </div>

        <button
          @click="emit('update:lockAspectRatio', !lockAspectRatio)"
          class="mb-1 p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
          :class="lockAspectRatio ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-700 dark:text-slate-500'"
          title="锁定宽高比"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="lockAspectRatio" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <div class="space-y-1 flex-1">
          <label class="text-xs text-slate-500 dark:text-slate-400">高度 (H)</label>
          <input
            type="number"
            :value="height"
            @input="e => emit('update:height', Number((e.target as HTMLInputElement).value))"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 no-spinner"
          />
        </div>
      </div>
    </div>

    <!-- 2. 外观样式 Style -->
    <div class="space-y-4">
      <label class="text-sm font-bold text-slate-700 dark:text-slate-300">外观样式</label>
      
      <!-- Padding -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-slate-600 dark:text-slate-400">内边距</label>
          <span class="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-400">{{ padding }}px</span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          :value="padding"
          @input="e => emit('update:padding', Number((e.target as HTMLInputElement).value))"
          class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
        />
      </div>

      <!-- Background Color -->
      <div class="space-y-3">
        <label class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">背景颜色</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="opt in bgOptions"
            :key="opt.value"
            @click="emit('update:bgColor', opt.value)"
            class="h-10 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden group"
            :class="[
              opt.class,
              bgColor === opt.value 
                ? 'ring-2 ring-indigo-500 border-transparent shadow-sm scale-105' 
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'
            ]"
            :title="opt.label"
          >
             <svg v-if="bgColor === opt.value" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 drop-shadow-sm absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24" :class="{'text-white dark:text-white': opt.value === '#000000'}">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
             </svg>
          </button>
          
          <!-- Custom Color Picker Button -->
          <div class="h-10 relative rounded-xl border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all overflow-hidden flex items-center justify-center"
               :class="{'ring-2 ring-indigo-500 border-transparent': !['transparent', '#ffffff', '#000000'].includes(bgColor)}">
            <input 
              type="color" 
              :value="bgColor === 'transparent' ? '#ffffff' : bgColor"
              @input="e => emit('update:bgColor', (e.target as HTMLInputElement).value)"
              class="absolute inset-0 w-[150%] h-[150%] p-0 border-0 cursor-pointer -top-1/4 -left-1/4"
            />
             <svg class="w-4 h-4 text-slate-400 pointer-events-none absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-if="['transparent', '#ffffff', '#000000'].includes(bgColor)">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
             </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 图像调整 Filters -->
    <div class="space-y-4">
      <button 
        @click="showFilters = !showFilters"
        class="w-full flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <span>图像滤镜</span>
        <svg 
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': showFilters }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <!-- Filter Sliders Helper -->
      <div v-show="showFilters" class="space-y-3 transition-all">
        <!-- Hue -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>色相 (Hue)</span>
            <span>{{ hue }}°</span>
          </div>
          <input
            type="range" min="0" max="360"
            :value="hue"
            @input="e => emit('update:hue', Number((e.target as HTMLInputElement).value))"
            class="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style="background: linear-gradient(to right, red, orange, yellow, green, cyan, blue, violet, red);"
          />
        </div>

        <!-- Brightness -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>亮度 (Brightness)</span>
            <span>{{ brightness }}%</span>
          </div>
          <input
            type="range" min="0" max="200"
            :value="brightness"
            @input="e => emit('update:brightness', Number((e.target as HTMLInputElement).value))"
            class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
          />
        </div>

        <!-- Contrast -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>对比度 (Contrast)</span>
            <span>{{ contrast }}%</span>
          </div>
          <input
            type="range" min="0" max="200"
            :value="contrast"
            @input="e => emit('update:contrast', Number((e.target as HTMLInputElement).value))"
            class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
          />
        </div>
        
        <!-- Saturation -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>饱和度 (Saturation)</span>
            <span>{{ saturation }}%</span>
          </div>
          <input
            type="range" min="0" max="200"
            :value="saturation"
            @input="e => emit('update:saturation', Number((e.target as HTMLInputElement).value))"
            class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
          />
        </div>

        <!-- Opacity -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>不透明度 (Opacity)</span>
            <span>{{ opacity }}%</span>
          </div>
          <input
            type="range" min="0" max="100"
            :value="opacity"
            @input="e => emit('update:opacity', Number((e.target as HTMLInputElement).value))"
            class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
          />
        </div>
      </div>
    </div>

    <!-- 4. 导出设置 Output -->
    <div class="space-y-4">
      <label class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">导出格式</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="fmt in formatOptions"
          :key="fmt.value"
          @click="emit('update:outputFormat', fmt.value)"
          class="py-2 text-xs font-bold border rounded-lg transition-all"
          :class="outputFormat === fmt.value 
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none' 
            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'"
        >
          {{ fmt.label }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="pt-4 mt-auto">
      <button
        @click="emit('download')"
        :disabled="isGenerating"
        class="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg v-if="!isGenerating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isGenerating ? '生成中...' : `下载 ${outputFormat.toUpperCase()}` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}
.bg-grid-slate-200\/50 {
  background-image: linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

/* Hide number input spinners */
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}
</style>
