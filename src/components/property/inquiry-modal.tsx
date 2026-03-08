'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface InquiryModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
}

const WHATSAPP_NUMBER = '971588919223' // +971588919223 

const COUNTRY_CODES = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
]

// Generate time slots in 30-minute intervals
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = hour.toString().padStart(2, '0')
      const minuteStr = minute.toString().padStart(2, '0')
      const time24 = `${hourStr}:${minuteStr}`

      // Convert to 12-hour format for display
      const period = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const time12 = `${hour12}:${minuteStr} ${period}`

      slots.push({ value: time24, label: time12 })
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export default function InquiryModal({ isOpen, onClose, propertyId, propertyTitle }: InquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+971',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatTime12Hour = (time24: string) => {
    if (!time24) return ''
    const [hourStr, minuteStr] = time24.split(':')
    const hour = parseInt(hourStr)
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minuteStr} ${period}`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const fullPhone = `${formData.countryCode} ${formData.phone}`.trim()
      const messageLines = [
        `Property: ${propertyTitle}`,
        `Property link: ${typeof window !== 'undefined' ? `${window.location.origin}/properties/${propertyId}` : ''}`,
        formData.preferredDate ? `Preferred date: ${formatDate(formData.preferredDate)}` : '',
        formData.preferredTime ? `Preferred time: ${formatTime12Hour(formData.preferredTime)}` : '',
        formData.message
      ].filter(Boolean)
      const res = await fetch('/api/enquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.name.split(' ')[0] || formData.name,
          last_name: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: fullPhone,
          subject: `Inquiry: ${propertyTitle}`,
          message: messageLines.join('\n'),
          event: formData.preferredDate ? `Visit ${formatDate(formData.preferredDate)}` : undefined
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Submission failed')
      }

      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        countryCode: '+971',
        phone: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
      })

      setTimeout(() => {
        onClose()
        setSubmitStatus(null)
      }, 3500)
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Mobile-only: side toast so user clearly sees "sent" without confusion */}
      {(submitStatus === 'success' || submitStatus === 'error') && (
        <div
          className="md:hidden fixed right-4 top-20 left-4 sm:left-auto z-[10002] w-auto sm:w-[min(280px,calc(100vw-2rem))] p-4 rounded-xl shadow-xl border border-white/20 animate-slide-in-right"
          style={{
            background: submitStatus === 'success' ? '#16a34a' : '#dc2626',
            color: 'white',
          }}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {submitStatus === 'success' ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>
            <div>
              <p className="font-semibold text-sm">{submitStatus === 'success' ? 'Message sent!' : 'Something went wrong'}</p>
              <p className="text-white/90 text-xs mt-0.5">
                {submitStatus === 'success' ? "We'll get back to you soon." : 'Try again or contact us on WhatsApp.'}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e5e5e5] p-4 md:p-6 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-black text-lg md:text-xl lg:text-2xl font-semibold leading-normal">
              Property Inquiry
            </h2>
            <p className="text-[#61656e] text-xs md:text-sm lg:text-base mt-1 truncate">
              {propertyTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#61656e] hover:text-black transition-colors shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success/error: on mobile show side toast only; on desktop show inline banner */}
        {submitStatus === 'success' && (
          <div className="hidden md:flex items-center gap-3 w-full p-4 md:p-5 bg-green-600 text-white shadow-md">
            <span className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center" aria-hidden>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-base md:text-lg">Message sent!</p>
              <p className="text-green-100 text-sm md:text-base">We&apos;ll get back to you soon.</p>
            </div>
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="hidden md:flex items-center gap-3 w-full p-4 md:p-5 bg-red-600 text-white shadow-md">
            <span className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center" aria-hidden>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-base md:text-lg">Something went wrong</p>
              <p className="text-red-100 text-sm md:text-base">Please try again or contact us on WhatsApp.</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="w-full">
              <label htmlFor="name" className="block text-black text-sm md:text-base font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                placeholder="Enter Full Name"
              />
            </div>

            {/* Email */}
            <div className="w-full">
              <label htmlFor="email" className="block text-black text-sm md:text-base font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                placeholder="Enter Email"
              />
            </div>

            {/* Phone */}
            <div className="w-full">
              <label htmlFor="phone" className="block text-black text-sm md:text-base font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="py-2.5 md:py-3 px-2 rounded-[4px] bg-white border border-[#dddddd] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent cursor-pointer"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="flex-1 py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                  placeholder="Enter Phone Number"
                />
              </div>
            </div>

            {/* Preferred Date */}
            <div className="w-full">
              <label htmlFor="preferredDate" className="block text-black text-sm md:text-base font-medium mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent cursor-pointer"
                onClick={(e) => e.currentTarget.showPicker?.()}
              />
            </div>

            {/* Preferred Time */}
            <div className="w-full">
              <label htmlFor="preferredTime" className="block text-black text-sm md:text-base font-medium mb-2">
                Preferred Time
              </label>
              <select
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent cursor-pointer"
              >
                <option value="">Select Time</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="w-full">
              <label htmlFor="message" className="block text-black text-sm md:text-base font-medium mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent resize-none"
                placeholder="Write your message..."
              />
            </div>

            {/* Submit Button */}
            <div className="mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C5A365] hover:bg-[#b08e55] transition-colors text-white rounded-[4px] font-medium text-sm md:text-base px-4 md:px-6 py-2.5 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
