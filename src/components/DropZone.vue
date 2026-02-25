<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'file-dropped', file: File): void
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg'))) {
      emit('file-dropped', file)
    } else {
      alert('请上传 SVG 文件')
    }
  }
}

const onFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    if (file && (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg'))) {
      emit('file-dropped', file)
    } else {
      alert('请上传 SVG 文件')
    }
    // Reset input value so same file can be selected again
    input.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out cursor-pointer group hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-400"
    :class="[
      isDragging 
        ? 'border-indigo-500 bg-indigo-50 scale-[1.02] dark:bg-indigo-900/30 dark:border-indigo-400' 
        : 'border-slate-300 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50'
    ]"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".svg"
      class="hidden"
      @change="onFileSelect"
    />
    
    <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none">
      <svg
        class="w-16 h-16 mb-4 text-slate-400 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400 transition-colors duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        ></path>
      </svg>
      <p class="mb-2 text-xl font-medium text-slate-700 dark:text-slate-200">
        <span class="font-bold text-indigo-600 dark:text-indigo-400">点击上传</span> 或拖拽 SVG 文件至此
      </p>
      <p class="text-sm text-slate-500 dark:text-slate-400">SVG (最大 5MB)</p>
    </div>
  </div>
</template>
