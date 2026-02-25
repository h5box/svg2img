import { ref, computed, type Ref, unref } from 'vue'
import { optimize } from 'svgo/browser'

export function useSvgConverter(svgDataUrlRef: Ref<string | null> | string | null) {
  const width = ref(0)
  const height = ref(0)
  const originalWidth = ref(0)
  const originalHeight = ref(0)
  const scale = ref(1) // Keep for internal calculation if needed, but UI removed it
  const lockAspectRatio = ref(true)
  const isGenerating = ref(false)
  const fileName = ref('converted') // Base name without extension

  // Layout & Style
  const padding = ref(0)
  const bgColor = ref('transparent') // 'transparent', '#ffffff', '#000000', or custom hex

  // Filters
  const hue = ref(0) // 0-360 deg
  const brightness = ref(100) // %
  const contrast = ref(100) // %
  const saturation = ref(100) // %
  const opacity = ref(100) // %

  // Output
  const outputFormat = ref<'png' | 'jpeg' | 'webp' | 'ico'>('png')
  
  // SVG Code
  const svgCode = ref('')

  // Computed
  const outputWidth = computed(() => Math.round(width.value))
  const outputHeight = computed(() => Math.round(height.value))

  const filterString = computed(() => {
    const filters = []
    if (hue.value !== 0) filters.push(`hue-rotate(${hue.value}deg)`)
    if (brightness.value !== 100) filters.push(`brightness(${brightness.value}%)`)
    if (contrast.value !== 100) filters.push(`contrast(${contrast.value}%)`)
    if (saturation.value !== 100) filters.push(`saturate(${saturation.value}%)`)
    if (opacity.value !== 100) filters.push(`opacity(${opacity.value}%)`)
    return filters.join(' ') || 'none'
  })

  // Load image helper
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  // Initialize dimensions when SVG is loaded
  const initDimensions = async (url: string) => {
    try {
      const img = await loadImage(url)
      originalWidth.value = img.width || 300
      originalHeight.value = img.height || 150
      width.value = originalWidth.value
      height.value = originalHeight.value
      
      // Also fetch the SVG code
      try {
        const res = await fetch(url)
        svgCode.value = await res.text()
      } catch (e) {
        console.warn('Could not fetch SVG code', e)
      }
    } catch (e) {
      console.error('Failed to load SVG', e)
    }
  }

  // SVGO Optimization
  const optimizeSvgCode = () => {
    if (!svgCode.value) return
    try {
      const result = optimize(svgCode.value, {
        multipass: true,
        plugins: [
          'preset-default',
          'removeDimensions',
          {
            name: 'removeAttrs',
            params: {
              attrs: '(stroke|fill)',
            },
          },
        ],
      })
      // @ts-ignore
      if (result.data) {
        // @ts-ignore
        svgCode.value = result.data
        // Update the preview by creating a new blob URL
        // This part needs to be handled carefully in the component or by updating the ref passed in
        // For now, we update the code ref, and the component should watch it or we emit an event
      }
    } catch (e) {
      console.error('SVGO optimization failed', e)
    }
  }

  const updateWidth = (newWidth: number) => {
    width.value = newWidth
    if (lockAspectRatio.value && originalWidth.value > 0) {
      height.value = Math.round(newWidth * (originalHeight.value / originalWidth.value))
    }
  }

  const updateHeight = (newHeight: number) => {
    height.value = newHeight
    if (lockAspectRatio.value && originalHeight.value > 0) {
      width.value = Math.round(newHeight * (originalWidth.value / originalHeight.value))
    }
  }

  // Draw logic
  const drawToCanvas = async (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const url = unref(svgDataUrlRef)
    if (!url) return

    // 1. Clear
    ctx.clearRect(0, 0, w, h)

    // 2. Fill Background
    if (bgColor.value !== 'transparent') {
      ctx.fillStyle = bgColor.value
      ctx.fillRect(0, 0, w, h)
    }

    // 3. Draw Image with Padding & Filters
    const img = await loadImage(url)
    const p = padding.value
    
    // Calculate draw area
    const drawX = p
    const drawY = p
    const drawW = Math.max(0, w - p * 2)
    const drawH = Math.max(0, h - p * 2)

    // Apply filters
    if (filterString.value !== 'none') {
      ctx.filter = filterString.value
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    
    // Reset filter
    ctx.filter = 'none'
  }

  // ICO Generator Helper
  const generateIco = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    const pngBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
    if (!pngBlob) throw new Error('Failed to create PNG blob')
    
    const pngData = new Uint8Array(await pngBlob.arrayBuffer())
    const fileSize = pngData.length
    const headerSize = 6
    const directorySize = 16
    const offset = headerSize + directorySize
    
    const buffer = new ArrayBuffer(offset + fileSize)
    const view = new DataView(buffer)
    
    // Header
    view.setUint16(0, 0, true)
    view.setUint16(2, 1, true)
    view.setUint16(4, 1, true)
    
    // Directory
    const w = canvas.width >= 256 ? 0 : canvas.width
    const h = canvas.height >= 256 ? 0 : canvas.height
    view.setUint8(6, w)
    view.setUint8(7, h)
    view.setUint8(8, 0)
    view.setUint8(9, 0)
    view.setUint16(10, 1, true)
    view.setUint16(12, 32, true)
    view.setUint32(14, fileSize, true)
    view.setUint32(18, offset, true)
    
    // Data
    new Uint8Array(buffer).set(pngData, offset)
    
    return new Blob([buffer], { type: 'image/x-icon' })
  }

  // Main Download Function
  const download = async () => {
    const url = unref(svgDataUrlRef)
    if (!url) return
    isGenerating.value = true
    
    try {
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth.value
      canvas.height = outputHeight.value
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('No canvas context')
      
      await drawToCanvas(ctx, outputWidth.value, outputHeight.value)
      
      let blob: Blob | null = null
      let ext = outputFormat.value
      
      if (outputFormat.value === 'ico') {
        blob = await generateIco(canvas)
      } else {
        const type = `image/${outputFormat.value}`
        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.9))
      }
      
      if (blob) {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${fileName.value}.${ext}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      }
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      isGenerating.value = false
    }
  }

  return {
    // Refs
    width, height, originalWidth, originalHeight, scale, lockAspectRatio,
    padding, bgColor,
    hue, brightness, contrast, saturation, opacity,
    outputFormat, svgCode, isGenerating, fileName,
    
    // Computed
    outputWidth, outputHeight, filterString,
    
    // Methods
    initDimensions, updateWidth, updateHeight,
    optimizeSvgCode, download
  }
}
