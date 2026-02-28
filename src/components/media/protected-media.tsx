'use client'

import { useEffect, useRef, useState } from 'react'

interface ProtectedMediaProps {
  src: string
  alt?: string
  type: 'IMAGE' | 'VIDEO'
  className?: string
  controls?: boolean
  preload?: 'metadata' | 'auto' | 'none'
  maxHeight?: string
}

export function ProtectedMedia({
  src,
  alt = '',
  type,
  className = '',
  controls = true,
  preload = 'metadata',
  maxHeight,
}: ProtectedMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Prevent context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Prevent common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S (Save), Ctrl+Shift+I (DevTools), Ctrl+U (View Source)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 's' || e.key === 'S' || e.key === 'i' || e.key === 'I' || e.key === 'u' || e.key === 'U')
      ) {
        e.preventDefault()
        return false
      }
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }
    }

    // Prevent drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Add event listeners
    container.addEventListener('contextmenu', handleContextMenu)
    container.addEventListener('keydown', handleKeyDown)
    container.addEventListener('dragstart', handleDragStart)
    container.addEventListener('selectstart', handleSelectStart)

    // Also prevent on window level for this container
    const handleWindowContextMenu = (e: MouseEvent) => {
      if (container.contains(e.target as Node)) {
        e.preventDefault()
        return false
      }
    }

    window.addEventListener('contextmenu', handleWindowContextMenu)

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu)
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('dragstart', handleDragStart)
      container.removeEventListener('selectstart', handleSelectStart)
      window.removeEventListener('contextmenu', handleWindowContextMenu)
    }
  }, [])

  const containerClasses = `protected-media relative select-none ${className}`
  const mediaStyle: React.CSSProperties = {
    ...(maxHeight ? { maxHeight } : {}),
    width: '100%',
    height: 'auto',
  }

  if (type === 'VIDEO') {
    return (
      <div
        ref={containerRef}
        className={containerClasses}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          pointerEvents: 'auto',
        }}
      >
        <video
          src={src}
          controls={controls}
          controlsList="nodownload"
          disablePictureInPicture
          preload={preload}
          onLoadedData={() => setIsLoading(false)}
          style={{
            ...mediaStyle,
            pointerEvents: controls ? 'auto' : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full"
        >
          Seu navegador não suporta vídeos.
        </video>
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onLoad={() => setIsLoading(false)}
        style={{
          ...mediaStyle,
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserDrag: 'none',
          WebkitUserDrag: 'none',
          display: 'block',
        }}
        className="w-full h-auto"
      />
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* Watermark overlay to discourage screenshots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'transparent',
          mixBlendMode: 'normal',
        }}
        aria-hidden="true"
      />
    </div>
  )
}

