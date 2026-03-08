'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  propertyTitle: string
}

export default function ImageViewerModal({ isOpen, onClose, images, initialIndex = 0, propertyTitle }: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])
  const savedScrollY = useRef(0)

  useEffect(() => {
    if (isOpen) {
      savedScrollY.current = typeof window !== 'undefined' ? window.scrollY : 0
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollY.current)
      })
    } else {
      document.body.style.overflow = 'unset'
      if (typeof window !== 'undefined') {
        window.scrollTo(0, savedScrollY.current)
      }
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    if (!isOpen) return
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      thumbnailRefs.current[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [isOpen, currentIndex])

  const handleNext = useCallback(() => {
    const validImages = images.filter((img) => img && img.trim() !== '');
    setCurrentIndex((prev) => (prev + 1) % validImages.length)
  }, [images])

  const handlePrevious = useCallback(() => {
    const validImages = images.filter((img) => img && img.trim() !== '');
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  }, [images])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleArrowKeys)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleArrowKeys)
    }
  }, [isOpen, handleNext, handlePrevious, onClose])

  if (!isOpen) return null

  if (typeof window === 'undefined') return null

  // Filter out empty images
  const validImages = images.filter((img) => img && img.trim() !== '');
  
  if (validImages.length === 0) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 text-white">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-base md:text-lg font-semibold truncate">{propertyTitle}</p>
            <p className="text-xs md:text-sm text-gray-400">
              Image {currentIndex + 1} of {validImages.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-6 pb-4 md:pb-6 relative">
          {/* Previous Button */}
          {validImages.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image Container - native img for instant change when clicking thumbnails */}
          <div className="relative w-full h-full max-w-6xl max-h-[60vh] md:max-h-[70vh]">
            {validImages[currentIndex] && validImages[currentIndex].trim() !== '' ? (
              <img
                key={currentIndex}
                src={validImages[currentIndex]}
                alt={`${propertyTitle} - Image ${currentIndex + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <svg className="w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Next Button */}
          {validImages.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail Strip */}
        {validImages.length > 1 && (
          <div className="bg-black/50 backdrop-blur-sm p-2 md:p-4">
            <div className="flex gap-2 md:gap-3 overflow-x-auto overflow-y-hidden max-w-6xl mx-auto scroll-smooth p-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {validImages.map((image, idx) => (
                <button
                  key={idx}
                  ref={(el) => { thumbnailRefs.current[idx] = el }}
                  onClick={() => setCurrentIndex(idx)}
                  className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 transition-all"
                >
                  <div className={`relative w-full h-full rounded-lg transition-all ${
                    currentIndex === idx 
                      ? 'ring-[3px] ring-[#1f2462] opacity-100' 
                      : 'opacity-50 hover:opacity-75'
                  }`}>
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
