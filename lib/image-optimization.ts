/**
 * Image Optimization Utilities
 * 
 * Helpers for optimizing images in the application
 */

/**
 * Generate Supabase storage URL with transformations
 * 
 * @param path - Storage path (e.g., 'service-photos/abc123.jpg')
 * @param options - Transformation options
 * @returns Optimized image URL
 * 
 * @example
 * ```ts
 * const url = getOptimizedImageUrl('service-photos/photo.jpg', {
 *   width: 800,
 *   height: 600,
 *   quality: 80,
 *   format: 'webp'
 * })
 * ```
 */
export function getOptimizedImageUrl(
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return path
  
  const { width, height, quality = 80, format = 'webp' } = options
  
  // Build transformation parameters
  const params = new URLSearchParams()
  if (width) params.append('width', width.toString())
  if (height) params.append('height', height.toString())
  params.append('quality', quality.toString())
  params.append('format', format)
  
  // Construct URL
  const baseUrl = `${supabaseUrl}/storage/v1/render/image/public/${path}`
  return `${baseUrl}?${params.toString()}`
}

/**
 * Get responsive image sizes for Next.js Image component
 * 
 * @param type - Image type (avatar, thumbnail, full, etc.)
 * @returns Sizes string for Next.js Image
 * 
 * @example
 * ```tsx
 * <Image
 *   src={url}
 *   sizes={getImageSizes('thumbnail')}
 *   fill
 * />
 * ```
 */
export function getImageSizes(
  type: 'avatar' | 'thumbnail' | 'card' | 'full' | 'hero'
): string {
  const sizes = {
    avatar: '(max-width: 768px) 48px, 64px',
    thumbnail: '(max-width: 768px) 100px, 150px',
    card: '(max-width: 768px) 50vw, 33vw',
    full: '(max-width: 768px) 100vw, 80vw',
    hero: '100vw',
  }
  
  return sizes[type]
}

/**
 * Get image dimensions for common use cases
 * 
 * @param type - Image type
 * @returns Width and height
 */
export function getImageDimensions(
  type: 'avatar' | 'thumbnail' | 'card' | 'full'
): { width: number; height: number } {
  const dimensions = {
    avatar: { width: 64, height: 64 },
    thumbnail: { width: 150, height: 150 },
    card: { width: 400, height: 300 },
    full: { width: 1200, height: 900 },
  }
  
  return dimensions[type]
}

/**
 * Compress image file before upload
 * 
 * @param file - File to compress
 * @param maxSizeMB - Maximum file size in MB
 * @param maxWidthOrHeight - Maximum width or height
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to blob with quality adjustment
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // Check if compressed size is acceptable
            const sizeMB = blob.size / 1024 / 1024
            if (sizeMB > maxSizeMB) {
              // Try again with lower quality
              const quality = Math.max(0.5, (maxSizeMB / sizeMB) * 0.9)
              canvas.toBlob(
                (blob2) => {
                  if (!blob2) {
                    reject(new Error('Failed to compress image'))
                    return
                  }
                  const compressedFile = new File([blob2], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                  resolve(compressedFile)
                },
                'image/jpeg',
                quality
              )
            } else {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            }
          },
          'image/jpeg',
          0.9
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * 
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateImage(
  file: File,
  options: {
    maxSizeMB?: number
    allowedTypes?: string[]
    minWidth?: number
    minHeight?: number
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth = 100,
    minHeight = 100,
  } = options
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }
  
  // Check file size
  const sizeMB = file.size / 1024 / 1024
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${sizeMB.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`,
    }
  }
  
  return { valid: true }
}

/**
 * Generate blurhash placeholder for image
 * Note: Requires blurhash library to be installed
 * 
 * @param imageUrl - Image URL
 * @returns Blurhash string
 */
export async function generateBlurhash(imageUrl: string): Promise<string> {
  // This is a placeholder - implement with blurhash library if needed
  // npm install blurhash
  return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' // Default blurhash
}

/**
 * Preload critical images
 * 
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  if (typeof window === 'undefined') return
  
  urls.forEach((url) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Get image placeholder for loading state
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns Data URL for placeholder
 */
export function getImagePlaceholder(
  width: number = 400,
  height: number = 300
): string {
  // Generate a simple gray placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="sans-serif"
        font-size="14"
        fill="#9ca3af"
      >
        Loading...
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

