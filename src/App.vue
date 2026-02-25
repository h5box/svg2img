<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import DropZone from './components/DropZone.vue'
import PreviewCanvas from './components/PreviewCanvas.vue'
import Controls from './components/Controls.vue'
import { useDragDrop } from './composables/useDragDrop'
import { useSvgConverter } from './composables/useSvgConverter'

const {
  isDragging,
  file,
  svgDataUrl,
  reset: resetFile
} = useDragDrop()

const {
  width,
  height,
  originalWidth,
  originalHeight,
  scale,
  lockAspectRatio,
  padding,
  bgColor,
  hue,
  brightness,
  contrast,
  saturation,
  opacity,
  outputFormat,
  svgCode,
  isGenerating,
  fileName,
  initDimensions,
  updateWidth,
  updateHeight,
  optimizeSvgCode,
  download
} = useSvgConverter(svgDataUrl)

// 记录初始 SVG 代码
const initialSvgCode = ref('')

// Theme Management
const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})

// Handle file drop/selection
const onFileLoaded = async (uploadedFile: File) => {
  if (uploadedFile.type === 'image/svg+xml' || uploadedFile.name.toLowerCase().endsWith('.svg')) {
    file.value = uploadedFile
    fileName.value = uploadedFile.name.replace(/\.svg$/i, '')
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      // Force correct MIME type for preview
      const blob = new Blob([content], { type: 'image/svg+xml' })
      svgDataUrl.value = URL.createObjectURL(blob)
      await initDimensions(svgDataUrl.value!)
      initialSvgCode.value = content // 保存初始代码
    }
    reader.readAsText(uploadedFile)
  }
}

const onReset = () => {
  resetFile()
  width.value = 0
  height.value = 0
  scale.value = 1
  svgCode.value = ''
  initialSvgCode.value = ''
}

// 还原 SVG 代码
const resetSvgCode = () => {
  if (initialSvgCode.value) {
    onUpdateSvgCode(initialSvgCode.value)
  }
}

// Handle SVG Code updates (from Editor or SVGO)
watch(svgCode, (newCode) => {
  if (!newCode) return
  const blob = new Blob([newCode], { type: 'image/svg+xml' })
  // We should ideally revoke old object URL to avoid leaks, but useDragDrop manages svgDataUrl
  // For now, simple update
  svgDataUrl.value = URL.createObjectURL(blob)
})

const onUpdateSvgCode = (code: string) => {
  svgCode.value = code
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-700 dark:selection:bg-indigo-900 dark:selection:text-indigo-200 pb-20 transition-colors duration-300">
    <!-- Header -->
    <header class="w-full py-4 px-4 md:px-8 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 9C7 16 16 16 20 9" />
              <circle cx="4" cy="9" r="2" fill="currentColor" stroke="none"/>
              <circle cx="20" cy="9" r="2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-400">
              SVG转图片
            </h1>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Re-upload Button (Visible when file is loaded) -->
          <button 
            v-if="svgDataUrl"
            @click="onReset"
            class="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新上传
          </button>

          <!-- Theme Toggle -->
          <button 
            @click="toggleDark" 
            class="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            :title="isDark ? '切换亮色模式' : '切换暗色模式'"
          >
            <!-- Sun Icon -->
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- Moon Icon -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          
          <a href="https://github.com" target="_blank" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div v-if="!svgDataUrl" class="max-w-2xl mx-auto transition-all duration-500 ease-out transform" :class="isDragging ? 'scale-105' : 'scale-100'">
        <div class="text-center mb-10 space-y-4">
          <h2 class="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            瞬间转换 SVG 为图片
          </h2>
          <p class="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            无需上传服务器，完全在浏览器本地处理。<br/>支持 PNG, JPG, WebP, ICO 格式。
          </p>
        </div>
        
        <DropZone @file-dropped="onFileLoaded" />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in-up lg:h-[calc(100vh-8rem)]">
        <!-- Left: Preview -->
        <div class="lg:col-span-8 h-[50vh] lg:h-full">
           <PreviewCanvas
             :svg-data-url="svgDataUrl!"
             :svg-code="svgCode"
             :width="width"
             :height="height"
             :padding="padding"
             :bg-color="bgColor"
             :hue="hue"
             :brightness="brightness"
             :contrast="contrast"
             :saturation="saturation"
             :opacity="opacity"
             @update:svg-code="onUpdateSvgCode"
             @optimize="optimizeSvgCode"
             @reset-code="resetSvgCode"
           />
        </div>

        <!-- Right: Controls -->
        <div class="lg:col-span-4 sticky top-24 max-h-[calc(100vh-8rem)]">
          <Controls
            :width="width"
            :height="height"
            :original-width="originalWidth"
            :original-height="originalHeight"
            :scale="scale"
            v-model:lock-aspect-ratio="lockAspectRatio"
            
            v-model:padding="padding"
            v-model:bg-color="bgColor"
            
            v-model:hue="hue"
            v-model:brightness="brightness"
            v-model:contrast="contrast"
            v-model:saturation="saturation"
            v-model:opacity="opacity"
            
            v-model:output-format="outputFormat"
            
            :is-generating="isGenerating"
            :file-name="fileName"
            
            @update:width="updateWidth"
            @update:height="updateHeight"
            @download="download"
            @reset="onReset"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style>
/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
html, body {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
