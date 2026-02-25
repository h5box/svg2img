import { ref } from 'vue'

export function useDragDrop() {
  const isDragging = ref(false)
  const file = ref<File | null>(null)
  const svgContent = ref<string | null>(null)
  const svgDataUrl = ref<string | null>(null)

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
  }

  const handleFile = (uploadedFile: File) => {
    if (uploadedFile.type === 'image/svg+xml') {
      file.value = uploadedFile
      const reader = new FileReader()
      reader.onload = (e) => {
        svgContent.value = e.target?.result as string
        // Create a Data URL for img src
        const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
        svgDataUrl.value = URL.createObjectURL(blob)
      }
      reader.readAsText(uploadedFile)
    } else {
      alert('请上传 SVG 文件')
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    const droppedFile = e.dataTransfer?.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  const onFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files && input.files[0]) {
      handleFile(input.files[0])
    }
  }

  const reset = () => {
    file.value = null
    svgContent.value = null
    if (svgDataUrl.value) {
      URL.revokeObjectURL(svgDataUrl.value)
      svgDataUrl.value = null
    }
  }

  return {
    isDragging,
    file,
    svgContent,
    svgDataUrl,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    reset
  }
}
