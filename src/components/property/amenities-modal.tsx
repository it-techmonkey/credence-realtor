'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getAmenityIcon } from '@/lib/amenityIcons'

interface AmenitiesModalProps {
  isOpen: boolean
  onClose: () => void
  amenities: string[]
  /** When provided, shows icons per amenity (from look API). */
  amenitiesWithIds?: { id: string; label: string }[]
  propertyTitle: string
}

export default function AmenitiesModal({ isOpen, onClose, amenities, amenitiesWithIds, propertyTitle }: AmenitiesModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const items = (amenitiesWithIds && amenitiesWithIds.length > 0)
    ? amenitiesWithIds
    : amenities.map((label) => ({ id: '', label }))

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 md:px-6 py-5 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-secondary text-lg md:text-xl font-bold">
              Amenities
            </h2>
            <p className="text-gray-500 text-sm mt-0.5 truncate">{propertyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-secondary transition-colors shrink-0 p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item, index) => {
              const Icon = getAmenityIcon(item.id)
              return (
                <div
                  key={item.id || index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 md:px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
