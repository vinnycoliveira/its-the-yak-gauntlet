import { useState, useCallback, useRef, useEffect } from 'react'
import Cropper from 'react-easy-crop'

/**
 * Helper to create a cropped image from canvas
 */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.9)
  })
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

export default function ImageCropper({ onImageReady, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          const url = URL.createObjectURL(blob)
          setImageSrc(url)
          return
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImageSrc(url)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImageSrc(url)
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onImageReady(croppedBlob)
    } catch (err) {
      console.error('Failed to crop image:', err)
    }
  }

  const handleReset = () => {
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  // No image selected yet - show upload area
  if (!imageSrc) {
    return (
      <div className="space-y-4">
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-yak-gold bg-yak-gold/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <p className="text-white font-medium">Drop image here or click to upload</p>
            <p className="text-sm text-gray-400">Or paste from clipboard (Cmd/Ctrl+V)</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  // Image selected - show cropper
  return (
    <div className="space-y-4">
      <div className="relative h-64 bg-black rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape="round"
          showGrid={false}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">Zoom:</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-yak-gold"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Choose Different
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-2 bg-yak-gold text-yak-navy font-semibold rounded-lg hover:bg-yak-gold-light transition-colors"
        >
          Use This Image
        </button>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-gray-400 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
